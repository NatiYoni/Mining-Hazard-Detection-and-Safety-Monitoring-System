package controllers

import (
	"minesense-backend/usecases"
	"net/http"

	"github.com/gin-gonic/gin"
)

type AlertController struct {
	AlertUseCase *usecases.AlertUseCase
}

func NewAlertController(uc *usecases.AlertUseCase) *AlertController {
	return &AlertController{AlertUseCase: uc}
}

func (c *AlertController) GetAllAlerts(ctx *gin.Context) {
	alerts, err := c.AlertUseCase.GetAllAlerts()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch alerts"})
		return
	}

	ctx.JSON(http.StatusOK, alerts)
}
