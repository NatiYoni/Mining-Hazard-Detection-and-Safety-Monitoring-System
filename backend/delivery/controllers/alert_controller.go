package controllers

import (
	"minesense-backend/usecases"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AlertController struct {
	AlertUseCase *usecases.AlertUseCase
}

func NewAlertController(uc *usecases.AlertUseCase) *AlertController {
	return &AlertController{AlertUseCase: uc}
}

func (c *AlertController) GetAllAlerts(ctx *gin.Context) {
	deviceIDStr := ctx.Query("device_id")
	if deviceIDStr != "" {
		deviceID, err := uuid.Parse(deviceIDStr)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
			return
		}
		alerts, err := c.AlertUseCase.GetAlertsByDevice(deviceID)
		if err != nil {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch alerts for device"})
			return
		}
		ctx.JSON(http.StatusOK, alerts)
		return
	}

	alerts, err := c.AlertUseCase.GetAllAlerts()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch alerts"})
		return
	}

	ctx.JSON(http.StatusOK, alerts)
}
