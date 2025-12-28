package main

import (
	"minesense-backend/config"
	"minesense-backend/delivery/controllers"
	"minesense-backend/delivery/router"
	"minesense-backend/infrastructure/database"
	"minesense-backend/infrastructure/websocket"
	"minesense-backend/usecases"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Connect to database
	database.ConnectDB(cfg)

	// Initialize WebSocket Hub
	hub := websocket.NewHub()
	go hub.Run()

	// Initialize Repositories
	deviceRepo := database.NewDeviceRepo(database.DB)
	sensorRepo := database.NewSensorRepo(database.DB)
	alertRepo := database.NewAlertRepo(database.DB)
	userRepo := database.NewUserRepo(database.DB)

	// Initialize Use Cases
	deviceUseCase := usecases.NewDeviceUseCase(deviceRepo)
	sensorUseCase := usecases.NewSensorUseCase(sensorRepo, alertRepo)
	alertUseCase := usecases.NewAlertUseCase(alertRepo)
	userUseCase := usecases.NewUserUseCase(userRepo)

	// Initialize Controllers
	deviceController := controllers.NewDeviceController(deviceUseCase)
	sensorController := controllers.NewSensorController(sensorUseCase, hub)
	alertController := controllers.NewAlertController(alertUseCase)
	userController := controllers.NewUserController(userUseCase, cfg.JWTSecret)
	videoController := controllers.NewVideoController(hub)

	// Setup Router
	r := router.SetupRouter(sensorController, deviceController, alertController, userController, videoController, cfg.JWTSecret)

	// Run Server
	// Note: Render requires the server to bind to 0.0.0.0 (which Gin does by default with Run())
	// and listen on the port defined by the PORT environment variable.
	r.Run("0.0.0.0:" + cfg.Port)
}
