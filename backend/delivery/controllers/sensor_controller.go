package controllers

import (
	"encoding/json"
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
	DeviceID   string          `json:"device_id" binding:"required"`
	SensorType string          `json:"sensor_type" binding:"required"`
	Payload    json.RawMessage `json:"payload" binding:"required"`
}

func (c *SensorController) ReceiveSensorData(ctx *gin.Context) {
	var input SensorDataInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	deviceID, err := uuid.Parse(input.DeviceID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	err = c.SensorUseCase.ProcessSensorData(deviceID, input.SensorType, input.Payload)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process data"})
		return
	}

	// Broadcast to WebSocket clients
	c.Hub.BroadcastData(gin.H{
		"type":        "sensor_update",
		"device_id":   input.DeviceID,
		"sensor_type": input.SensorType,
		"payload":     input.Payload,
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
