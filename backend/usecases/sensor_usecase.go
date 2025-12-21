package usecases

import (
	"encoding/json"
	"minesense-backend/domain/entities"
	"minesense-backend/domain/interfaces"
	"time"

	"github.com/google/uuid"
)

type SensorUseCase struct {
	SensorRepo interfaces.SensorRepository
	AlertRepo  interfaces.AlertRepository
}

func NewSensorUseCase(sensorRepo interfaces.SensorRepository, alertRepo interfaces.AlertRepository) *SensorUseCase {
	return &SensorUseCase{
		SensorRepo: sensorRepo,
		AlertRepo:  alertRepo,
	}
}

func (uc *SensorUseCase) ProcessSensorData(deviceID uuid.UUID, sensorType string, payload json.RawMessage) error {
	reading := &entities.SensorReading{
		DeviceID:   deviceID,
		SensorType: sensorType,
		Payload:    payload,
		Timestamp:  time.Now(),
	}

	if err := uc.SensorRepo.Create(reading); err != nil {
		return err
	}

	// Simple hazard detection logic (placeholder)
	// In a real system, this would parse the payload and check thresholds
	// For now, we'll just log it or create a dummy alert if needed
	// Example: if sensorType == "gas" && value > threshold { create alert }

	return nil
}

func (uc *SensorUseCase) GetReadingsByDevice(deviceID uuid.UUID) ([]entities.SensorReading, error) {
	return uc.SensorRepo.FindByDeviceID(deviceID)
}
