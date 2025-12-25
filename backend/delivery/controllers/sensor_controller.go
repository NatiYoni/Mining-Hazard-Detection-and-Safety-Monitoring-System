package controllers

import (
	"bytes"
	"encoding/json"
	"io"
	"minesense-backend/infrastructure/websocket"
	"minesense-backend/usecases"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SensorController struct {
	SensorUseCase *usecases.SensorUseCase
	Hub           *websocket.Hub
}

func NewSensorController(uc *usecases.SensorUseCase, hub *websocket.Hub) *SensorController {
	return &SensorController{SensorUseCase: uc, Hub: hub}
}

type SensorDataInput struct {
	DeviceID   string          `json:"device_id"`
	SensorType string          `json:"sensor_type"`
	Payload    json.RawMessage `json:"payload"`
}

func (c *SensorController) ReceiveSensorData(ctx *gin.Context) {
	// Read body
	bodyBytes, err := io.ReadAll(ctx.Request.Body)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}
	// Restore body just in case
	ctx.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	// 1. Try to parse as standard SensorDataInput
	var input SensorDataInput
	var deviceID uuid.UUID
	var sensorType string
	var payload json.RawMessage

	// We unmarshal manually to check fields
	if err := json.Unmarshal(bodyBytes, &input); err == nil && input.DeviceID != "" && input.SensorType != "" {
		// Standard format
		id, err := uuid.Parse(input.DeviceID)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID format"})
			return
		}
		deviceID = id
		sensorType = input.SensorType
		payload = input.Payload
	} else {
		// 2. Fallback: Flat JSON (Telemetry)
		// Try to get DeviceID from Context (Auth Token)
		if idVal, exists := ctx.Get("user_id"); exists {
			// Handle potential types for user_id from JWT
			switch v := idVal.(type) {
			case string:
				deviceID, _ = uuid.Parse(v)
			case uuid.UUID:
				deviceID = v
			}
		}

		// If still no DeviceID, check if it's in the flat JSON
		var flatMap map[string]interface{}
		if err := json.Unmarshal(bodyBytes, &flatMap); err == nil {
			if idStr, ok := flatMap["device_id"].(string); ok && deviceID == uuid.Nil {
				deviceID, _ = uuid.Parse(idStr)
			}
		}

		if deviceID == uuid.Nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Device ID required (in token or body)"})
			return
		}

		sensorType = "telemetry" // Default for flat JSON
		payload = bodyBytes      // The whole body is the payload
	}

	err = c.SensorUseCase.ProcessSensorData(deviceID, sensorType, payload)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process data"})
		return
	}

	// Broadcast to WebSocket clients
	c.Hub.BroadcastData(gin.H{
		"type":        "sensor_update",
		"device_id":   deviceID.String(),
		"sensor_type": sensorType,
		"payload":     payload,
		"timestamp":   time.Now(),
	})

	ctx.JSON(http.StatusOK, gin.H{"message": "Data received successfully"})
}

func (c *SensorController) GetLatest(ctx *gin.Context) {
	deviceIDStr := ctx.Query("device_id")
	deviceID, err := uuid.Parse(deviceIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}
	reading, err := c.SensorUseCase.GetLatest(deviceID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "No data found"})
		return
	}
	ctx.JSON(http.StatusOK, reading)
}

func (c *SensorController) GetHistory(ctx *gin.Context) {
	deviceIDStr := ctx.Query("device_id")
	start := ctx.Query("start")
	end := ctx.Query("end")
	deviceID, err := uuid.Parse(deviceIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}
	readings, err := c.SensorUseCase.GetHistory(deviceID, start, end)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch history"})
		return
	}
	ctx.JSON(http.StatusOK, readings)
}

func (c *SensorController) ServeWS(ctx *gin.Context) {
	c.Hub.HandleWebSocket(ctx)
}
