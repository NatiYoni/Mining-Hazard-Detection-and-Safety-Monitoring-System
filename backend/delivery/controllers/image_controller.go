package controllers

import (
	"minesense-backend/infrastructure/websocket"
	"minesense-backend/usecases"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ImageController struct {
	ImageUseCase *usecases.ImageUseCase
	Hub          *websocket.Hub
}

func NewImageController(uc *usecases.ImageUseCase, hub *websocket.Hub) *ImageController {
	return &ImageController{ImageUseCase: uc, Hub: hub}
}

type UploadImageInput struct {
	DeviceID string `json:"device_id" binding:"required"`
	ImageURL string `json:"image_url" binding:"required"`
}

func (c *ImageController) UploadImage(ctx *gin.Context) {
	var input UploadImageInput
	if err := ctx.ShouldBindJSON(&input); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	deviceID, err := uuid.Parse(input.DeviceID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}

	image, err := c.ImageUseCase.SaveImage(deviceID, input.ImageURL)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	// Broadcast to WebSocket clients
	c.Hub.BroadcastData(gin.H{
		"type":    "image_update",
		"payload": image,
	})

	ctx.JSON(http.StatusCreated, image)
}

func (c *ImageController) GetImage(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	image, err := c.ImageUseCase.GetImage(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "Image not found"})
		return
	}

	ctx.JSON(http.StatusOK, image)
}

func (c *ImageController) GetLatest(ctx *gin.Context) {
	deviceIDStr := ctx.Query("device_id")
	deviceID, err := uuid.Parse(deviceIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid device ID"})
		return
	}
	image, err := c.ImageUseCase.GetLatest(deviceID)
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "No image found"})
		return
	}
	ctx.JSON(http.StatusOK, image)
}
