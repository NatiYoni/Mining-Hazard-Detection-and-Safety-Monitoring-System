
package main

import (
	"minesense-backend/config"
	"minesense-backend/delivery/controllers"
	"minesense-backend/delivery/router"
	"minesense-backend/infrastructure/database"
	"minesense-backend/usecases"
)

func main() {
	// Load configuration
	cfg := config.LoadConfig()

	// Connect to database
	database.ConnectDB(cfg)

	// Initialize Repositories
	deviceRepo := database.NewDeviceRepo(database.DB)
	sensorRepo := database.NewSensorRepo(database.DB)
	alertRepo := database.NewAlertRepo(database.DB)
	userRepo := database.NewUserRepo(database.DB)
	imageRepo := database.NewImageRepo(database.DB)

	// Initialize Use Cases
	deviceUseCase := usecases.NewDeviceUseCase(deviceRepo)
	sensorUseCase := usecases.NewSensorUseCase(sensorRepo, alertRepo)
	alertUseCase := usecases.NewAlertUseCase(alertRepo)
	userUseCase := usecases.NewUserUseCase(userRepo)
	imageUseCase := usecases.NewImageUseCase(imageRepo)

	// Initialize Controllers
	deviceController := controllers.NewDeviceController(deviceUseCase)
	sensorController := controllers.NewSensorController(sensorUseCase)
	alertController := controllers.NewAlertController(alertUseCase)
	userController := controllers.NewUserController(userUseCase, cfg.JWTSecret)
	imageController := controllers.NewImageController(imageUseCase)

	// Setup Router
	r := router.SetupRouter(sensorController, deviceController, alertController, userController, imageController, cfg.JWTSecret)

	// Run Server
	r.Run(":" + cfg.Port)
}
