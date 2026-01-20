package database

import (
	"minesense-backend/domain/entities"
	"minesense-backend/domain/interfaces"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DeviceRepo struct {
	DB *gorm.DB
}

func NewDeviceRepo(db *gorm.DB) interfaces.DeviceRepository {
	return &DeviceRepo{DB: db}
}

func (r *DeviceRepo) Create(device *entities.Device) error {
	return r.DB.Create(device).Error
}

func (r *DeviceRepo) FindByID(id uuid.UUID) (*entities.Device, error) {
	var device entities.Device
	err := r.DB.First(&device, "id = ?", id).Error
	return &device, err
}

func (r *DeviceRepo) FindAll() ([]entities.Device, error) {
	var devices []entities.Device
	err := r.DB.Find(&devices).Error
	return devices, err
}

func (r *DeviceRepo) Update(device *entities.Device) error {
	return r.DB.Save(device).Error
}
