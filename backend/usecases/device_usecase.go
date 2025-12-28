package usecases

import (
	"minesense-backend/domain/entities"
	"minesense-backend/domain/interfaces"
	"time"

	"github.com/google/uuid"
)

type DeviceUseCase struct {
	DeviceRepo interfaces.DeviceRepository
}

func NewDeviceUseCase(deviceRepo interfaces.DeviceRepository) *DeviceUseCase {
	return &DeviceUseCase{DeviceRepo: deviceRepo}
}

func (uc *DeviceUseCase) RegisterDevice(name, location string, supervisorID *uuid.UUID) (*entities.Device, error) {
	device := &entities.Device{
		DeviceName:   name,
		Location:     location,
		SupervisorID: supervisorID,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	err := uc.DeviceRepo.Create(device)
	return device, err
}

func (uc *DeviceUseCase) GetAllDevices() ([]entities.Device, error) {
	return uc.DeviceRepo.FindAll()
}

func (uc *DeviceUseCase) GetDeviceByID(id uuid.UUID) (*entities.Device, error) {
	return uc.DeviceRepo.FindByID(id)
}
