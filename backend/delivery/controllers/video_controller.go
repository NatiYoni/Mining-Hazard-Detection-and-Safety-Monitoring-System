package controllers

import (
	"minesense-backend/infrastructure/websocket"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type VideoController struct {
	Hub *websocket.Hub
}

func NewVideoController(hub *websocket.Hub) *VideoController {
	return &VideoController{Hub: hub}
}

type StreamFrameInput struct {
	DeviceID string `json:"device_id" binding:"required"`
	ImageURL string `json:"image_url" binding:"required"`
}

func (c *VideoController) StreamFrame(ctx *gin.Context) {
	var input StreamFrameInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Broadcast to WebSocket clients
	c.Hub.BroadcastData(gin.H{
		"type": "image_update",
		"payload": gin.H{
			"device_id":  input.DeviceID,
			"image_url":  input.ImageURL,
			"created_at": time.Now(),
		},
	})

	ctx.Status(http.StatusOK)
}
