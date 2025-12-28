package interfaces

import (
	"minesense-backend/domain/entities"

	"github.com/google/uuid"
)

type DeviceRepository interface {
	Create(device *entities.Device) error
	FindByID(id uuid.UUID) (*entities.Device, error)
	FindAll() ([]entities.Device, error)
}

type SensorRepository interface {
	Create(reading *entities.SensorReading) error
	FindByDeviceID(deviceID uuid.UUID) ([]entities.SensorReading, error)
	GetLatestByDeviceID(deviceID uuid.UUID) (*entities.SensorReading, error)
	GetHistory(deviceID uuid.UUID, start, end string) ([]entities.SensorReading, error)
}

type AlertRepository interface {
	Create(alert *entities.Alert) error
	FindAll() ([]entities.Alert, error)
	FindByDeviceID(deviceID uuid.UUID) ([]entities.Alert, error)
}

type UserRepository interface {
	Create(user *entities.User) error
	FindByUsername(username string) (*entities.User, error)
	Update(user *entities.User) error
}
