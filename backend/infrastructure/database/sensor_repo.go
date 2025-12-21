package database

import (
	"minesense-backend/domain/entities"
	"minesense-backend/domain/interfaces"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SensorRepo struct {
	DB *gorm.DB
}

func NewSensorRepo(db *gorm.DB) interfaces.SensorRepository {
	return &SensorRepo{DB: db}
}

func (r *SensorRepo) Create(reading *entities.SensorReading) error {
	return r.DB.Create(reading).Error
}

func (r *SensorRepo) FindByDeviceID(deviceID uuid.UUID) ([]entities.SensorReading, error) {
	var readings []entities.SensorReading
	err := r.DB.Where("device_id = ?", deviceID).Find(&readings).Error
	return readings, err
}
