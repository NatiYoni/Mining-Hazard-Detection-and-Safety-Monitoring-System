package controllers_test

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"strings"
	"sync"
	"testing"
	"time"

	"minesense-backend/delivery/controllers"
	"minesense-backend/domain/entities"
	"minesense-backend/infrastructure/middleware"
	appws "minesense-backend/infrastructure/websocket"
	"minesense-backend/usecases"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

const evidenceTimeout = 5 * time.Second
const evidenceJWTSecret = "synthetic-local-test-key-not-for-deployment"

var evidenceDeviceID = uuid.MustParse("00000000-0000-4000-8000-000000000001")

type expectedAlert struct {
	Type     string `json:"type"`
	Severity string `json:"severity"`
}

type readingFixture struct {
	Name    string          `json:"name"`
	Payload json.RawMessage `json:"payload"`
	Alerts  []expectedAlert `json:"alerts"`
}

func TestSensorEvidence(t *testing.T) {
	gin.SetMode(gin.TestMode)
	data, err := os.ReadFile("testdata/sensor_readings.json")
	if err != nil {
		t.Fatal(err)
	}
	var fixtures []readingFixture
	if err := json.Unmarshal(data, &fixtures); err != nil {
		t.Fatal(err)
	}
	fixture := func(name string) readingFixture {
		t.Helper()
		for _, f := range fixtures {
			if f.Name == name {
				return f
			}
		}
		t.Fatalf("missing synthetic fixture %q", name)
		return readingFixture{}
	}
	gas := fixture("gas_alert")
	combined := fixture("combined_alerts")
	baseline := fixture("non_alert_boundaries")

	t.Run("configured_rules", func(t *testing.T) {
		for _, f := range fixtures {
			t.Run(f.Name, func(t *testing.T) {
				h := newEvidenceHarness(t, &fixtureStore{})
				conn := h.connect(t)
				h.assertReading(t, conn, wrappedReading(t, f.Payload), f)
			})
		}
	})

	t.Run("flat_telemetry_uses_token_device", func(t *testing.T) {
		h := newEvidenceHarness(t, &fixtureStore{})
		h.assertReading(t, h.connect(t), string(gas.Payload), gas)
	})

	t.Run("stored_buzzer_off_is_preserved", func(t *testing.T) {
		h := newEvidenceHarness(t, &fixtureStore{buzzerOff: true})
		h.assertReading(t, h.connect(t), wrappedReading(t, baseline.Payload), baseline)
	})

	t.Run("persistence_before_publication", func(t *testing.T) {
		readingEntered, alertEntered := make(chan struct{}), make(chan struct{})
		releaseReading, releaseAlert := make(chan struct{}), make(chan struct{})
		var readingOnce, alertOnce sync.Once
		unblockReading := func() { readingOnce.Do(func() { close(releaseReading) }) }
		unblockAlert := func() { alertOnce.Do(func() { close(releaseAlert) }) }
		defer unblockReading()
		defer unblockAlert()
		store := &fixtureStore{
			beforeReading: func() { close(readingEntered); <-releaseReading },
			beforeAlert:   func() { close(alertEntered); <-releaseAlert },
		}
		h := newEvidenceHarness(t, store)
		conn := h.connect(t)
		body := wrappedReading(t, gas.Payload)
		result := make(chan ingestionResult, 1)
		go func() { result <- h.post(body, h.token) }()

		awaitSignal(t, readingEntered)
		assertStore(t, store, 0, 0, nil)
		assertNoEvents(t, h.messages(t, conn))
		unblockReading()

		awaitSignal(t, alertEntered)
		assertStore(t, store, 1, 0, []string{"reading.stored"})
		assertNoEvents(t, h.messages(t, conn))
		unblockAlert()

		select {
		case response := <-result:
			assertAccepted(t, response, 1, true)
		case <-time.After(evidenceTimeout):
			t.Fatal("HTTP request did not finish after repository gates opened")
		}
		assertStore(t, store, 1, 1, []string{"reading.stored", "alert.stored:Gas Hazard", "device.read"})
		h.assertMessages(t, h.messages(t, conn), gas, store.snapshot().alerts)
		t.Log("gated reading write -> gated alert write -> sensor_update -> alert; no publication before either write completes")
	})

	t.Run("repeated_reading_is_not_deduplicated", func(t *testing.T) {
		h := newEvidenceHarness(t, &fixtureStore{})
		conn := h.connect(t)
		body := wrappedReading(t, gas.Payload)
		h.assertReading(t, conn, body, gas)
		h.assertReading(t, conn, body, gas)
		saved := h.store.snapshot()
		if len(saved.readings) != 2 || len(saved.alerts) != 2 ||
			saved.readings[0].ID == saved.readings[1].ID || saved.alerts[0].ID == saved.alerts[1].ID {
			t.Fatalf("identical requests must make separate repository writes: %+v", saved)
		}
		t.Log("same synthetic request twice -> two reading writes, two alert writes, two event pairs; no idempotency guarantee")
	})

	t.Run("disconnected_client_and_no_replay", func(t *testing.T) {
		h := newEvidenceHarness(t, &fixtureStore{})
		disconnected := h.connect(t)
		if err := disconnected.Close(); err != nil {
			t.Fatal(err)
		}
		assertAccepted(t, h.post(wrappedReading(t, gas.Payload), h.token), 1, true)
		assertStore(t, h.store, 1, 1, []string{"reading.stored", "alert.stored:Gas Hazard", "device.read"})
		reconnected := h.connect(t)
		assertNoEvents(t, h.messages(t, reconnected))
		h.assertReading(t, reconnected, wrappedReading(t, baseline.Payload), baseline)
		t.Log("disconnected receiver does not make ingestion fail; new connection gets no replay, only subsequent updates")
	})

	t.Run("failures", func(t *testing.T) {
		tests := []struct {
			name        string
			body        string
			noAuth      bool
			invalidAuth bool
			store       *fixtureStore
			status      int
			readings    int
			alerts      int
			operations  []string
			published   *readingFixture
		}{
			{name: "reading_repository", body: wrappedReading(t, gas.Payload), store: &fixtureStore{failReading: true},
				status: 500, operations: []string{"reading.failed"}},
			{name: "alert_repository", body: wrappedReading(t, gas.Payload), store: &fixtureStore{failAlertAt: 1},
				status: 500, readings: 1, operations: []string{"reading.stored", "alert.failed:Gas Hazard"}},
			{name: "partial_alert_writes_are_not_atomic", body: wrappedReading(t, combined.Payload), store: &fixtureStore{failAlertAt: 2},
				status: 500, readings: 1, alerts: 1, operations: []string{"reading.stored", "alert.stored:Gas Hazard", "alert.failed:Heat Stress"}},
			{name: "device_lookup", body: wrappedReading(t, gas.Payload), store: &fixtureStore{failDevice: true},
				status: 500, readings: 1, alerts: 1, operations: []string{"reading.stored", "alert.stored:Gas Hazard", "device.failed"}, published: &gas},
			{name: "invalid_device_id", body: `{"device_id":"not-a-uuid","sensor_type":"telemetry","payload":{"gas":701}}`, status: 400},
			{name: "nil_device_id", body: `{"device_id":"00000000-0000-0000-0000-000000000000","sensor_type":"telemetry","payload":{"gas":701}}`, status: 400},
			{name: "malformed_flat_json", body: `{"gas":`, status: 400},
			{name: "flat_null", body: `null`, status: 400},
			{name: "flat_array", body: `[701]`, status: 400},
			{name: "flat_scalar", body: `701`, status: 400},
			{name: "missing_payload", body: fmt.Sprintf(`{"device_id":%q,"sensor_type":"telemetry"}`, evidenceDeviceID), status: 400},
			{name: "null_payload", body: wrappedReading(t, json.RawMessage(`null`)), status: 400},
			{name: "array_payload", body: wrappedReading(t, json.RawMessage(`[701]`)), status: 400},
			{name: "string_payload", body: wrappedReading(t, json.RawMessage(`"701"`)), status: 400},
			{name: "missing_auth", body: wrappedReading(t, gas.Payload), noAuth: true, status: 401},
			{name: "invalid_auth", body: wrappedReading(t, gas.Payload), invalidAuth: true, status: 401},
		}
		for _, tc := range tests {
			t.Run(tc.name, func(t *testing.T) {
				h := newEvidenceHarness(t, tc.store)
				conn := h.connect(t)
				token := h.token
				if tc.noAuth {
					token = ""
				} else if tc.invalidAuth {
					token = "invalid-synthetic-token"
				}
				response := h.post(tc.body, token)
				if response.err != nil {
					t.Fatal(response.err)
				}
				if response.status != tc.status || response.body.Error == "" ||
					response.body.Message != "" || response.body.Buzzer != nil || response.body.AlertsGenerated != nil {
					t.Fatalf("want explicit HTTP %d error, got %+v", tc.status, response)
				}
				assertStore(t, h.store, tc.readings, tc.alerts, tc.operations)
				events := h.messages(t, conn)
				if tc.published != nil {
					h.assertMessages(t, events, *tc.published, h.store.snapshot().alerts)
				} else {
					assertNoEvents(t, events)
				}
				t.Logf("HTTP %d; retained fake writes: readings=%d alerts=%d; WebSocket sensor/alert events=%d", tc.status, tc.readings, tc.alerts, len(events))
			})
		}
	})
}

// These repositories record calls in memory. They do not run GORM or PostgreSQL.
type fixtureStore struct {
	mu            sync.Mutex
	readings      []entities.SensorReading
	alerts        []entities.Alert
	operations    []string
	alertCalls    int
	failReading   bool
	failAlertAt   int
	failDevice    bool
	buzzerOff     bool
	beforeReading func()
	beforeAlert   func()
}

type storeSnapshot struct {
	readings   []entities.SensorReading
	alerts     []entities.Alert
	operations []string
}

func (s *fixtureStore) snapshot() storeSnapshot {
	s.mu.Lock()
	defer s.mu.Unlock()
	return storeSnapshot{
		readings:   append([]entities.SensorReading(nil), s.readings...),
		alerts:     append([]entities.Alert(nil), s.alerts...),
		operations: append([]string(nil), s.operations...),
	}
}

type fixtureSensorRepository struct{ store *fixtureStore }

func (r fixtureSensorRepository) Create(reading *entities.SensorReading) error {
	s := r.store
	if s.beforeReading != nil {
		s.beforeReading()
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.failReading {
		s.operations = append(s.operations, "reading.failed")
		return errors.New("synthetic reading write failure")
	}
	reading.ID = uuid.MustParse(fmt.Sprintf("00000000-0000-4000-8001-%012d", len(s.readings)+1))
	saved := *reading
	saved.Payload = append(json.RawMessage(nil), reading.Payload...)
	s.readings = append(s.readings, saved)
	s.operations = append(s.operations, "reading.stored")
	return nil
}

func (fixtureSensorRepository) FindByDeviceID(uuid.UUID) ([]entities.SensorReading, error) {
	return nil, errors.New("unexpected FindByDeviceID in ingestion evidence")
}
func (fixtureSensorRepository) GetLatestByDeviceID(uuid.UUID) (*entities.SensorReading, error) {
	return nil, errors.New("unexpected GetLatestByDeviceID in ingestion evidence")
}
func (fixtureSensorRepository) GetHistory(uuid.UUID, string, string) ([]entities.SensorReading, error) {
	return nil, errors.New("unexpected GetHistory in ingestion evidence")
}

type fixtureAlertRepository struct{ store *fixtureStore }

func (r fixtureAlertRepository) Create(alert *entities.Alert) error {
	s := r.store
	if s.beforeAlert != nil {
		s.beforeAlert()
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.alertCalls++
	if s.alertCalls == s.failAlertAt {
		s.operations = append(s.operations, "alert.failed:"+alert.AlertType)
		return errors.New("synthetic alert write failure")
	}
	alert.ID = uuid.MustParse(fmt.Sprintf("00000000-0000-4000-8002-%012d", len(s.alerts)+1))
	s.alerts = append(s.alerts, *alert)
	s.operations = append(s.operations, "alert.stored:"+alert.AlertType)
	return nil
}

func (fixtureAlertRepository) FindAll() ([]entities.Alert, error) {
	return nil, errors.New("unexpected FindAll in ingestion evidence")
}
func (fixtureAlertRepository) FindByDeviceID(uuid.UUID) ([]entities.Alert, error) {
	return nil, errors.New("unexpected FindByDeviceID in ingestion evidence")
}

type fixtureDeviceRepository struct{ store *fixtureStore }

func (r fixtureDeviceRepository) FindByID(id uuid.UUID) (*entities.Device, error) {
	s := r.store
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.failDevice || id != evidenceDeviceID {
		s.operations = append(s.operations, "device.failed")
		return nil, errors.New("synthetic device lookup failure")
	}
	s.operations = append(s.operations, "device.read")
	return &entities.Device{ID: id, BuzzerActive: !s.buzzerOff}, nil
}

func (fixtureDeviceRepository) Create(*entities.Device) error {
	return errors.New("unexpected Create in ingestion evidence")
}
func (fixtureDeviceRepository) FindAll() ([]entities.Device, error) {
	return nil, errors.New("unexpected FindAll in ingestion evidence")
}
func (fixtureDeviceRepository) Update(*entities.Device) error {
	return errors.New("unexpected Update in ingestion evidence")
}

type evidenceHarness struct {
	store  *fixtureStore
	hub    *appws.Hub
	server *httptest.Server
	ready  chan struct{}
	token  string
}

func newEvidenceHarness(t *testing.T, store *fixtureStore) *evidenceHarness {
	t.Helper()
	if store == nil {
		store = &fixtureStore{}
	}
	h := &evidenceHarness{store: store, hub: appws.NewHub(), ready: make(chan struct{}, 1)}
	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": evidenceDeviceID.String(), "role": "Device",
	}).SignedString([]byte(evidenceJWTSecret))
	if err != nil {
		t.Fatal(err)
	}
	h.token = token
	sensor := usecases.NewSensorUseCase(fixtureSensorRepository{store}, fixtureAlertRepository{store})
	device := usecases.NewDeviceUseCase(fixtureDeviceRepository{store})
	controller := controllers.NewSensorController(sensor, device, h.hub)
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan struct{})
	go func() {
		h.hub.RunContext(ctx)
		close(done)
	}()
	r := gin.New()
	r.POST("/api/v1/sensor-data", middleware.AuthMiddleware(evidenceJWTSecret), controller.ReceiveSensorData)
	r.GET("/api/v1/ws", func(c *gin.Context) {
		controller.ServeWS(c)
		h.ready <- struct{}{}
	})
	h.server = httptest.NewServer(r)
	h.server.Client().Timeout = evidenceTimeout
	t.Cleanup(func() {
		h.server.Close()
		cancel()
		awaitSignal(t, done)
	})
	return h
}

func (h *evidenceHarness) connect(t *testing.T) *websocket.Conn {
	t.Helper()
	dialer := websocket.Dialer{HandshakeTimeout: evidenceTimeout}
	conn, response, err := dialer.Dial("ws"+strings.TrimPrefix(h.server.URL, "http")+"/api/v1/ws", nil)
	if err != nil {
		if response != nil {
			response.Body.Close()
		}
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close() })
	// Upgrade completion alone does not guarantee that the hub accepted registration.
	awaitSignal(t, h.ready)
	return conn
}

type ingestionBody struct {
	Message         string `json:"message"`
	AlertsGenerated *int   `json:"alerts_generated"`
	Buzzer          *bool  `json:"buzzer"`
	Error           string `json:"error"`
}

type ingestionResult struct {
	status int
	body   ingestionBody
	err    error
}

func (h *evidenceHarness) post(body, token string) ingestionResult {
	request, err := http.NewRequest(http.MethodPost, h.server.URL+"/api/v1/sensor-data", strings.NewReader(body))
	if err != nil {
		return ingestionResult{err: err}
	}
	request.Header.Set("Content-Type", "application/json")
	if token != "" {
		request.Header.Set("Authorization", "Bearer "+token)
	}
	response, err := h.server.Client().Do(request)
	if err != nil {
		return ingestionResult{err: err}
	}
	defer response.Body.Close()
	result := ingestionResult{status: response.StatusCode}
	result.err = json.NewDecoder(response.Body).Decode(&result.body)
	return result
}

type sensorEvent struct {
	Type       string          `json:"type"`
	DeviceID   uuid.UUID       `json:"device_id"`
	SensorType string          `json:"sensor_type"`
	Payload    json.RawMessage `json:"payload"`
	Timestamp  time.Time       `json:"timestamp"`
	Alert      *entities.Alert `json:"alert"`
}

func (h *evidenceHarness) messages(t *testing.T, conn *websocket.Conn) []sensorEvent {
	t.Helper()
	// An ordered test-only marker proves absence of earlier events without sleeping.
	h.hub.BroadcastData(map[string]string{"type": "evidence_barrier"})
	if err := conn.SetReadDeadline(time.Now().Add(evidenceTimeout)); err != nil {
		t.Fatal(err)
	}
	var events []sensorEvent
	for {
		var event sensorEvent
		if err := conn.ReadJSON(&event); err != nil {
			t.Fatalf("read WebSocket event: %v", err)
		}
		if event.Type == "evidence_barrier" {
			return events
		}
		events = append(events, event)
	}
}

func (h *evidenceHarness) assertReading(t *testing.T, conn *websocket.Conn, body string, fixture readingFixture) {
	t.Helper()
	before := h.store.snapshot()
	assertAccepted(t, h.post(body, h.token), len(fixture.Alerts), !h.store.buzzerOff)
	after := h.store.snapshot()
	if len(after.readings) != len(before.readings)+1 || len(after.alerts) != len(before.alerts)+len(fixture.Alerts) {
		t.Fatalf("unexpected repository write counts: before=%+v after=%+v", before, after)
	}
	reading := after.readings[len(before.readings)]
	if reading.ID == uuid.Nil || reading.DeviceID != evidenceDeviceID || reading.SensorType != "telemetry" || reading.Timestamp.IsZero() {
		t.Fatalf("unexpected persisted reading: %+v", reading)
	}
	assertJSONEqual(t, reading.Payload, fixture.Payload)
	h.assertMessages(t, h.messages(t, conn), fixture, after.alerts[len(before.alerts):])
	t.Logf("%s: HTTP 200; one fake reading write, %d fake alert writes; sensor_update then %d alert events",
		fixture.Name, len(fixture.Alerts), len(fixture.Alerts))
}

func (h *evidenceHarness) assertMessages(t *testing.T, events []sensorEvent, fixture readingFixture, saved []entities.Alert) {
	t.Helper()
	if len(events) != 1+len(fixture.Alerts) || len(saved) != len(fixture.Alerts) {
		t.Fatalf("want sensor_update and %d alerts, got %+v; saved alerts=%+v", len(fixture.Alerts), events, saved)
	}
	if events[0].Type != "sensor_update" || events[0].DeviceID != evidenceDeviceID ||
		events[0].SensorType != "telemetry" || events[0].Timestamp.IsZero() {
		t.Fatalf("unexpected sensor_update: %+v", events[0])
	}
	assertJSONEqual(t, events[0].Payload, fixture.Payload)
	for i, expected := range fixture.Alerts {
		event, persisted := events[i+1], saved[i]
		alert := event.Alert
		if event.Type != "alert" || alert == nil {
			t.Fatalf("expected alert event, got %+v", event)
		}
		if persisted.ID == uuid.Nil || alert.ID != persisted.ID ||
			alert.DeviceID != evidenceDeviceID || alert.DeviceID != persisted.DeviceID ||
			alert.AlertType != expected.Type || alert.Severity != expected.Severity ||
			alert.AlertType != persisted.AlertType || alert.Severity != persisted.Severity ||
			alert.Message == "" || alert.Message != persisted.Message ||
			alert.CreatedAt.IsZero() || !alert.CreatedAt.Equal(persisted.CreatedAt) {
			t.Fatalf("event must match fixture and persisted alert: event=%+v persisted=%+v expected=%+v", alert, persisted, expected)
		}
	}
}

func wrappedReading(t *testing.T, payload json.RawMessage) string {
	t.Helper()
	body, err := json.Marshal(controllers.SensorDataInput{
		DeviceID: evidenceDeviceID.String(), SensorType: "telemetry", Payload: payload,
	})
	if err != nil {
		t.Fatal(err)
	}
	return string(body)
}

func assertAccepted(t *testing.T, result ingestionResult, alerts int, buzzer bool) {
	t.Helper()
	if result.err != nil {
		t.Fatal(result.err)
	}
	if result.status != http.StatusOK || result.body.Error != "" || result.body.Message != "Data received successfully" ||
		result.body.AlertsGenerated == nil || *result.body.AlertsGenerated != alerts ||
		result.body.Buzzer == nil || *result.body.Buzzer != buzzer {
		t.Fatalf("expected HTTP 200 with %d alerts and buzzer=%t, got %+v", alerts, buzzer, result)
	}
}

func assertStore(t *testing.T, store *fixtureStore, readings, alerts int, operations []string) {
	t.Helper()
	saved := store.snapshot()
	if len(saved.readings) != readings || len(saved.alerts) != alerts || !reflect.DeepEqual(saved.operations, operations) {
		t.Fatalf("want readings=%d alerts=%d operations=%v; got %+v", readings, alerts, operations, saved)
	}
}

func assertNoEvents(t *testing.T, events []sensorEvent) {
	t.Helper()
	if len(events) != 0 {
		t.Fatalf("unexpected WebSocket publication: %+v", events)
	}
}

func assertJSONEqual(t *testing.T, actual, expected json.RawMessage) {
	t.Helper()
	var got, want interface{}
	if err := json.Unmarshal(actual, &got); err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(expected, &want); err != nil {
		t.Fatal(err)
	}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("JSON mismatch: got %s, want %s", actual, expected)
	}
}

func awaitSignal(t *testing.T, signal <-chan struct{}) {
	t.Helper()
	select {
	case <-signal:
	case <-time.After(evidenceTimeout):
		t.Fatal("timed out waiting for deterministic test synchronization")
	}
}
