package database

import (
	"minesense-backend/domain/entities"
	"minesense-backend/domain/interfaces"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AlertRepo struct {
	DB *gorm.DB
}

func NewAlertRepo(db *gorm.DB) interfaces.AlertRepository {
	return &AlertRepo{DB: db}
}

func (r *AlertRepo) Create(alert *entities.Alert) error {
	return r.DB.Create(alert).Error
}

func (r *AlertRepo) FindAll() ([]entities.Alert, error) {
	var alerts []entities.Alert
	err := r.DB.Preload("Device").Find(&alerts).Error
	return alerts, err
}

func (r *AlertRepo) FindByDeviceID(deviceID uuid.UUID) ([]entities.Alert, error) {
	var alerts []entities.Alert
	err := r.DB.Where("device_id = ?", deviceID).Preload("Device").Find(&alerts).Error
	return alerts, err
}
