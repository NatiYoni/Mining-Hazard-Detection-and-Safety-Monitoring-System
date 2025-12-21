package database

import (
	"fmt"
	"log"

	"minesense-backend/config"
	"minesense-backend/domain/entities"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB(cfg *config.Config) {
	var err error
	var dsn string

	// Check if a full DATABASE_URL is provided (common in cloud platforms like Render/Supabase)
	if cfg.DatabaseURL != "" {
		dsn = cfg.DatabaseURL
	} else {
		// Fallback to individual components for local development
		dsn = fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC",
			cfg.DBHost,
			cfg.DBUser,
			cfg.DBPassword,
			cfg.DBName,
			cfg.DBPort,
		)
	}

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	log.Println("Connected to database successfully")

	// Auto Migrate
	err = DB.AutoMigrate(
		&entities.User{},
		&entities.Device{},
		&entities.SensorReading{},
		&entities.Alert{},
		&entities.Image{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database: ", err)
	}
	log.Println("Database migration completed")
}
