# Reproducible sensor-to-alert evidence

**Synthetic, local execution with fake persistence. This is not PostgreSQL integration, durability evidence, or validation of mining safety.**

## Run the demonstration

From the repository root, with Go 1.25.5 or newer (see [go.mod](../go.mod)):

```sh
(cd backend && go test -count=1 -v -timeout=60s ./delivery/controllers ./infrastructure/websocket)
```

The test command is the demonstration, not a wrapper around sample output. `-count=1` forces execution rather than a cached result. Success requires all assertions to pass; failures return a nonzero exit code.

Only the existing Go dependencies are needed. A first run may download them through Go's configured module proxy. No `.env`, database, Docker, firmware, frontend, real credentials, or hosted API is used. Tests start ephemeral loopback HTTP servers, open real WebSocket connections, and close their servers, clients, and hub goroutines. Missing dependencies or unavailable local sockets cause failure, not a skipped or simulated success.

Expect `PASS` for `TestSensorEvidence` and `TestWebSocketEvidence`, with semantic logs such as `one fake reading write, 1 fake alert writes` and `no publication before either write completes`. Upgrade-failure and closed-socket error logs are intentional negative cases. Go's elapsed times and socket addresses vary; they are not performance measurements or acceptance thresholds.

## Execution boundary

```text
synthetic HTTP POST /api/v1/sensor-data over loopback
  -> production JWT middleware and SensorController
  -> production SensorUseCase: validate object, create reading, evaluate rules, create alerts
       -> test-only in-memory SensorRepository and AlertRepository
  -> production WebSocket Hub -> real loopback WebSocket receiver at /api/v1/ws
  -> production DeviceUseCase -> test-only DeviceRepository -> HTTP response with buzzer state
```

The tests construct the production controller, use cases, and hub directly. Test-owned Gin routes use the production endpoint paths and authentication middleware; full `SetupRouter`, server bootstrap, configuration loading, login/device registration, GORM adapters, and actual web/mobile/firmware clients are outside this boundary.

The fake repositories implement the [production interfaces](../domain/interfaces/repositories.go). They copy readings and alerts into mutex-protected memory and assign deterministic fixture IDs. **Nothing is persisted to disk or PostgreSQL**, and all fixture state disappears after each case. These fakes do not enforce database constraints or demonstrate database transactions.

Source entry points:

- [HTTP/controller evidence and fake repositories](../delivery/controllers/sensor_evidence_test.go)
- [Fixed synthetic payloads and expected alert types/severities](../delivery/controllers/testdata/sensor_readings.json)
- [WebSocket delivery-failure and cleanup evidence](../infrastructure/websocket/hub_evidence_test.go)
- Production [controller](../delivery/controllers/sensor_controller.go), [use case and rules](../usecases/sensor_usecase.go), and [hub](../infrastructure/websocket/hub.go)

## Expected semantic results

Each valid fixture produces HTTP 200, one reading-repository write, and one `sensor_update`. Alert-producing fixtures additionally write and publish the alerts below. Assertions compare the WebSocket payload with the submitted payload and each alert's ID, device, type, severity, message, and creation time with the fake-stored alert. Both stored buzzer states are exercised.

| Fixture | Synthetic payload | Expected alerts |
| --- | --- | --- |
| `non_alert_boundaries` | `{"gas":700,"temp":24,"fall":false,"vibration":500}` | None |
| `gas_alert` | `{"gas":701}` | Gas Hazard / Critical |
| `heat_warning` | `{"temp":24.5}` | Heat Stress / Warning |
| `heat_warning_upper_boundary` | `{"temp":25}` | Heat Stress / Warning |
| `heat_critical` | `{"temp":25.5}` | Heat Stress / Critical |
| `fall_alert` | `{"fall":true}` | Man-Down / Critical |
| `vibration_alert` | `{"vibration":501}` | Structural Warning / High |
| `combined_alerts` | `{"gas":701,"temp":25.5,"fall":true,"vibration":501}` | Gas, heat, fall, then vibration: four alerts |
| `wrong_field_types_are_ignored` | Numeric and boolean values encoded as strings | None: current rules ignore these field types |

These values characterize the existing hard-coded rules, **not recommended safety limits**. No thresholds are changed. Rules inspect payload keys regardless of `sensor_type`; field-level measurement validation remains permissive. A non-alert result does not establish that a reading or environment is safe.

Requests normally wrap the fixture payload in `device_id`, `sensor_type: "telemetry"`, and `payload`. A separate case sends flat telemetry and obtains the synthetic device ID from a locally signed test JWT. The test key is explicitly test-only, and no real account or worker data is used.

## Ordering and failure assertions

Repository gates pause first the reading write, then an alert write, **before** mutating the fake store. While each gate is closed, a test-only `evidence_barrier` passes through the same hub; the receiver must see it without any preceding sensor or alert event. After both gates open, `sensor_update` must precede the alert. The same ordered marker detects unexpected extra publications after other requests. These markers are test controls, not new production event types.

Registration signals and channels synchronize the tests; there are no arbitrary sleeps. Five-second I/O/synchronization deadlines only bound hung tests. Production timestamps still use the wall clock; assertions check presence and stored/published alert-time equality, not fixed clock values.

| Injected/rejected condition | HTTP status | Retained fake reading / alert writes | WebSocket sensor/alert events |
| --- | --- | --- | --- |
| Missing or invalid JWT | 401 | 0 / 0 | None |
| Invalid or nil device UUID; malformed JSON; missing, null, array, or scalar payload | 400 | 0 / 0 | None |
| Reading repository fails | 500 | 0 / 0 | None |
| First alert write fails | 500 | 1 / 0 | None |
| Second alert write fails for the combined fixture | 500 | 1 / 1 | None |
| Device-state lookup fails after the gas alert was stored and submitted | 500 | 1 / 1 | `sensor_update`, then `alert` |

Regression fixes reject malformed/non-object payloads before repository writes and propagate alert-write and device-lookup failures rather than reporting success or inventing `buzzer: false`. Alert creation stops at its first error, before publication; earlier writes are not rolled back. The later device-state lookup does not suppress already-submitted sensor/alert events. An HTTP error can therefore follow both writes and publication.

Additional cases demonstrate that identical gas requests make two reading writes, two alert writes, and two event pairs; a disconnected receiver does not turn ingestion into an HTTP error; and a newly connected receiver gets no replay, only subsequent updates. A hub-level test deterministically closes one server-side socket, verifies removal on write failure, and confirms that another real connection still receives the event. A plain HTTP request to the WebSocket handler is rejected with HTTP 400.

## Limits and unsupported guarantees

- **Persistence:** GORM/PostgreSQL, migrations, foreign keys, crash recovery, database concurrency, and durability are not exercised. Production adapters issue separate reading/alert `Create` calls; there is no enclosing reading-plus-alert transaction. The failure cases prove call-level partial progress with fakes, not actual PostgreSQL rollback behavior.
- **Retries:** There is no idempotency key, deduplication, or exactly-once contract. HTTP 500 can follow successful writes and event submission. Retrying can create additional readings/alerts; this change adds no automatic retry.
- **Delivery:** HTTP 200 is not a receiver acknowledgement. Hub submission does not confirm that any client received a message. There is no outbox, replay, delivery retry, or ordering guarantee across concurrent requests. Ordering assertions concern one request at a time.
- **Slow/disconnected clients:** Writes are synchronous, without per-client write deadlines or slow-client isolation; a slow receiver can block the hub and HTTP producers. There is no read/heartbeat loop for proactive disconnection detection. The forced-write-failure test does not establish a disconnect-detection time bound or a backpressure guarantee.
- **Shutdown:** Tests use `RunContext` only after HTTP producers stop and writes finish. It closes registered connections and returns; cancellation cannot interrupt a blocked client write. Calls must not continue submitting to a stopped hub. The existing server still uses `Run`; this is not a server-wide graceful-shutdown implementation.
- **Real-world scope:** No hardware calibration, physical buzzer actuation, deployment, production load, latency, comprehensive authentication/security assessment, or safety certification is established.

## Broader backend checks

From `backend/`:

```sh
go test -count=1 -timeout=60s ./...
go test -race -count=1 -timeout=120s ./...
```

The race command additionally requires Go race-detector support, cgo, and a C compiler. The repository has no existing CI workflow to extend; these are local commands, not a claim of passing hosted CI.
