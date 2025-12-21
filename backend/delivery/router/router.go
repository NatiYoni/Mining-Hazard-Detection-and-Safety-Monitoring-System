package router

import (
	"minesense-backend/delivery/controllers"
	"minesense-backend/infrastructure/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter(
	sensorController *controllers.SensorController,
	deviceController *controllers.DeviceController,
	alertController *controllers.AlertController,
	userController *controllers.UserController,
	imageController *controllers.ImageController,
	jwtSecret string,
) *gin.Engine {
	r := gin.Default()

	// Middleware
	r.Use(middleware.LoggingMiddleware())

	// Public routes
	api := r.Group("/api/v1")
	{
		api.POST("/login", userController.Login)
		api.POST("/register", userController.Register) // In a real app, this might be protected or admin-only
	}

	// Protected routes
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware(jwtSecret))
	{
		// Sensor Data
		protected.POST("/sensor-data", sensorController.ReceiveSensorData)

		// Devices (Admin only)
		protected.POST("/devices", middleware.RoleMiddleware("Admin"), deviceController.CreateDevice)
		protected.GET("/devices", deviceController.GetAllDevices)
		protected.GET("/devices/:id", deviceController.GetDeviceByID)

		// Alerts
		protected.GET("/alerts", alertController.GetAllAlerts)

		// Images
		protected.POST("/images", imageController.UploadImage)
		protected.GET("/images/:id", imageController.GetImage)
	}

	return r
}
