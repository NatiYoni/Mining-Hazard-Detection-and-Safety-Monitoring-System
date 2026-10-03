package websocket

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	gorillaws "github.com/gorilla/websocket"
)

const hubEvidenceTimeout = 5 * time.Second

func TestWebSocketEvidence(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("invalid_upgrade", func(t *testing.T) {
		h := newHubEvidence(t)
		response, err := h.server.Client().Get(h.server.URL + "/ws")
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		if response.StatusCode != http.StatusBadRequest {
			t.Fatalf("want HTTP 400 for a plain HTTP request, got %d", response.StatusCode)
		}
		t.Log("non-WebSocket HTTP request -> explicit HTTP 400 upgrade failure")
	})

	t.Run("failed_write_drops_client_not_other_receivers", func(t *testing.T) {
		h := newHubEvidence(t)
		h.connect(t)
		h.hub.mu.Lock()
		var failed *gorillaws.Conn
		for conn := range h.hub.clients {
			failed = conn
		}
		h.hub.mu.Unlock()
		if failed == nil {
			t.Fatal("first client was not registered")
		}
		healthy := h.connect(t)
		// Close the server-side transport to make the next write fail deterministically.
		if err := failed.Close(); err != nil {
			t.Fatal(err)
		}
		h.hub.BroadcastData(map[string]string{"type": "synthetic_delivery"})
		readHubEvent(t, healthy, "synthetic_delivery")
		h.hub.BroadcastData(map[string]string{"type": "evidence_barrier"})
		readHubEvent(t, healthy, "evidence_barrier")
		h.hub.mu.Lock()
		_, retained := h.hub.clients[failed]
		count := len(h.hub.clients)
		h.hub.mu.Unlock()
		if retained || count != 1 {
			t.Fatalf("failed client retained=%t; registered clients=%d, want 1", retained, count)
		}
		t.Log("forced local socket write failure -> failed client removed; another real WebSocket still receives the event")
	})

	t.Run("quiescent_shutdown_closes_clients", func(t *testing.T) {
		h := newHubEvidence(t)
		conn := h.connect(t)
		h.cancel()
		waitHubSignal(t, h.done)
		if err := conn.SetReadDeadline(time.Now().Add(hubEvidenceTimeout)); err != nil {
			t.Fatal(err)
		}
		_, _, err := conn.ReadMessage()
		if err == nil {
			t.Fatal("expected the hub to close its client connection")
		}
		if netErr, ok := err.(net.Error); ok && netErr.Timeout() {
			t.Fatalf("connection was not closed: %v", err)
		}
		h.hub.mu.Lock()
		count := len(h.hub.clients)
		h.hub.mu.Unlock()
		if count != 0 {
			t.Fatalf("shutdown retained %d clients", count)
		}
		t.Log("cancellation after producers stop -> hub returns and closes registered connections")
	})
}

type hubEvidence struct {
	hub    *Hub
	server *httptest.Server
	ready  chan struct{}
	done   chan struct{}
	cancel context.CancelFunc
}

func newHubEvidence(t *testing.T) *hubEvidence {
	t.Helper()
	ctx, cancel := context.WithCancel(context.Background())
	h := &hubEvidence{hub: NewHub(), ready: make(chan struct{}, 1), done: make(chan struct{}), cancel: cancel}
	go func() {
		h.hub.RunContext(ctx)
		close(h.done)
	}()
	r := gin.New()
	r.GET("/ws", func(c *gin.Context) {
		h.hub.HandleWebSocket(c)
		h.ready <- struct{}{}
	})
	h.server = httptest.NewServer(r)
	h.server.Client().Timeout = hubEvidenceTimeout
	t.Cleanup(func() {
		h.server.Close()
		h.cancel()
		waitHubSignal(t, h.done)
	})
	return h
}

func (h *hubEvidence) connect(t *testing.T) *gorillaws.Conn {
	t.Helper()
	dialer := gorillaws.Dialer{HandshakeTimeout: hubEvidenceTimeout}
	conn, response, err := dialer.Dial("ws"+strings.TrimPrefix(h.server.URL, "http")+"/ws", nil)
	if err != nil {
		if response != nil {
			response.Body.Close()
		}
		t.Fatal(err)
	}
	t.Cleanup(func() { conn.Close() })
	waitHubSignal(t, h.ready)
	h.hub.BroadcastData(map[string]string{"type": "evidence_registered"})
	readHubEvent(t, conn, "evidence_registered")
	return conn
}

func readHubEvent(t *testing.T, conn *gorillaws.Conn, expected string) {
	t.Helper()
	if err := conn.SetReadDeadline(time.Now().Add(hubEvidenceTimeout)); err != nil {
		t.Fatal(err)
	}
	var event struct {
		Type string `json:"type"`
	}
	if err := conn.ReadJSON(&event); err != nil {
		t.Fatal(err)
	}
	if event.Type != expected {
		t.Fatalf("got event %q, want %q", event.Type, expected)
	}
}

func waitHubSignal(t *testing.T, signal <-chan struct{}) {
	t.Helper()
	select {
	case <-signal:
	case <-time.After(hubEvidenceTimeout):
		t.Fatal("timed out waiting for hub synchronization")
	}
}
