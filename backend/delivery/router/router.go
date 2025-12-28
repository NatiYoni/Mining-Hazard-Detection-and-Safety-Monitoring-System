package router

import (
	"minesense-backend/delivery/controllers"
	"minesense-backend/infrastructure/middleware"
	"time"

	"github.com/gin-contrib/cors"
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

	// CORS Configuration
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	config.AllowCredentials = true
	config.MaxAge = 12 * time.Hour

	r.Use(cors.New(config))
	r.Use(middleware.LoggingMiddleware())

	// Health Check
	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "message": "Mining Hazard Detection API is running"})
	})

	// Public routes
	api := r.Group("/api/v1")
	{
		api.POST("/login", userController.Login)
		api.POST("/register", userController.Register) // In a real app, this might be protected or admin-only
		api.GET("/ws", sensorController.ServeWS)       // WebSocket endpoint for real-time updates
	}

	// Protected routes
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware(jwtSecret))
	{
		// Sensor Data
		protected.POST("/sensor-data", sensorController.ReceiveSensorData)
		protected.GET("/sensors/latest", sensorController.GetLatest)
		protected.GET("/sensors/history", sensorController.GetHistory)

		// Devices (Admin only)
		protected.POST("/devices", middleware.RoleMiddleware("Admin"), deviceController.CreateDevice)
		protected.GET("/devices", deviceController.GetAllDevices)
		protected.GET("/devices/:id", deviceController.GetDeviceByID)

		// Alerts
		protected.GET("/alerts", alertController.GetAllAlerts)

		// User
		protected.POST("/change-password", userController.ChangePassword)

		// Images
		protected.POST("/images", imageController.UploadImage)
		protected.GET("/images/:id", imageController.GetImage)
		protected.GET("/images/latest", imageController.GetLatest)
	}

	return r
}
