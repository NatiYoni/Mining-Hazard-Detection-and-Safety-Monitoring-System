package controllers

import (
	"minesense-backend/infrastructure/websocket"
	"minesense-backend/usecases"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DeviceController struct {
	DeviceUseCase *usecases.DeviceUseCase
	Hub           *websocket.Hub
}

func NewDeviceController(uc *usecases.DeviceUseCase, hub *websocket.Hub) *DeviceController {
	return &DeviceController{DeviceUseCase: uc, Hub: hub}
}

type CreateDeviceInput struct {
	DeviceName   string `json:"device_name" binding:"required"`
	Location     string `json:"location"`
	SupervisorID string `json:"supervisor_id"` // Optional UUID string
}

func (c *DeviceController) CreateDevice(ctx *gin.Context) {
	var input CreateDeviceInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var supervisorID *uuid.UUID
	if input.SupervisorID != "" {
		id, err := uuid.Parse(input.SupervisorID)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid supervisor ID"})
			return
		}
		supervisorID = &id
	}

	device, err := c.DeviceUseCase.RegisterDevice(input.DeviceName, input.Location, supervisorID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create device"})
		return
	}

	ctx.JSON(http.StatusCreated, device)
}

func (c *DeviceController) GetAllDevices(ctx *gin.Context) {
	devices, err := c.DeviceUseCase.GetAllDevices()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch devices"})
		return
	}

	ctx.JSON(http.StatusOK, devices)
}

func (c *DeviceController) GetDeviceByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	device, err := c.DeviceUseCase.GetDeviceByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	ctx.JSON(http.StatusOK, device)
}

func (c *DeviceController) TriggerBuzzer(ctx *gin.Context) {
	idStr := ctx.Param("id")
	_, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	// Broadcast command to WebSocket clients
	c.Hub.BroadcastData(gin.H{
		"type":      "device_command",
		"device_id": idStr,
		"command":   "buzzer_on",
		"timestamp": time.Now(),
	})

	ctx.JSON(http.StatusOK, gin.H{"message": "Buzzer triggered successfully"})
}
