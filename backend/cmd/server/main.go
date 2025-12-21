
package main

import (
	"log"
	"os"

	"minesense-backend/delivery/controllers"
	"minesense-backend/delivery/router"
	"minesense-backend/infrastructure/database"
	"minesense-backend/usecases"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("Warning: .env file not found, relying on system environment variables")
	}

	// Connect to database
	database.ConnectDB()

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
	userController := controllers.NewUserController(userUseCase)
	imageController := controllers.NewImageController(imageUseCase)

	// Setup Router
	r := router.SetupRouter(sensorController, deviceController, alertController, userController, imageController)

	// Run Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	r.Run(":" + port)
}
