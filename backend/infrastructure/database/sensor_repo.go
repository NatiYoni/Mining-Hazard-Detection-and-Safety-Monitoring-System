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

func (r *SensorRepo) GetLatestByDeviceID(deviceID uuid.UUID) (*entities.SensorReading, error) {
	var reading entities.SensorReading
	err := r.DB.Where("device_id = ?", deviceID).Order("timestamp desc").First(&reading).Error
	return &reading, err
}

func (r *SensorRepo) GetHistory(deviceID uuid.UUID, start, end string) ([]entities.SensorReading, error) {
	var readings []entities.SensorReading
	query := r.DB.Where("device_id = ?", deviceID)
	if start != "" {
		query = query.Where("timestamp >= ?", start)
	}
	if end != "" {
		query = query.Where("timestamp <= ?", end)
	}
	err := query.Order("timestamp asc").Find(&readings).Error
	return readings, err
}
