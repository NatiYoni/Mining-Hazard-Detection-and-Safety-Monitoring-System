package controllers

import (
	"encoding/json"
	"minesense-backend/usecases"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type SensorController struct {
	SensorUseCase *usecases.SensorUseCase
}

func NewSensorController(uc *usecases.SensorUseCase) *SensorController {
	return &SensorController{SensorUseCase: uc}
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

	ctx.JSON(http.StatusOK, gin.H{"message": "Data received successfully"})
}
