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
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	// 1. Get current device state
	device, err := c.DeviceUseCase.GetDeviceByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Device not found"})
		return
	}

	// 2. Activate Buzzer for 30 Seconds
	device.BuzzerActive = true
	if err := c.DeviceUseCase.UpdateDevice(device); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update buzzer state"})
		return
	}

	// 3. Broadcast ON command
	c.Hub.BroadcastData(gin.H{
		"type":        "device_command",
		"device_id":   idStr,
		"command":     "buzzer_on",
		"is_active":   true,
		"timestamp":   time.Now(),
	})

	// 4. Start Timer to Turn Off after 30s
	go func(dID uuid.UUID) {
		time.Sleep(30 * time.Second)
		
		// Retrieve fresh instance to avoid race conditions
		d, err := c.DeviceUseCase.GetDeviceByID(dID)
		if err == nil {
			d.BuzzerActive = false
			c.DeviceUseCase.UpdateDevice(d)
			
			// Broadcast OFF command
			c.Hub.BroadcastData(gin.H{
				"type":        "device_command",
				"device_id":   dID.String(),
				"command":     "buzzer_off",
				"is_active":   false,
				"timestamp":   time.Now(),
			})
		}
	}(id)

	ctx.JSON(http.StatusOK, gin.H{
		"message":       "Buzzer activated for 30 seconds",
		"buzzer_active": true,
	})
}
