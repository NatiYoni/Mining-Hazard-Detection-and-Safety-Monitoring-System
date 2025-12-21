package controllers

import (
	"minesense-backend/usecases"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type DeviceController struct {
	DeviceUseCase *usecases.DeviceUseCase
}

func NewDeviceController(uc *usecases.DeviceUseCase) *DeviceController {
	return &DeviceController{DeviceUseCase: uc}
}

type CreateDeviceInput struct {
	DeviceName string `json:"device_name" binding:"required"`
	Location   string `json:"location"`
}

func (c *DeviceController) CreateDevice(ctx *gin.Context) {
	var input CreateDeviceInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	device, err := c.DeviceUseCase.RegisterDevice(input.DeviceName, input.Location)
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
