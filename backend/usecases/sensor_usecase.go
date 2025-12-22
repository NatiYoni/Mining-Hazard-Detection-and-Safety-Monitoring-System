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

	// Hazard Detection
	var data map[string]interface{}
	if err := json.Unmarshal(payload, &data); err == nil {
		uc.checkHazards(deviceID, sensorType, data)
	}

	return nil
}

func (uc *SensorUseCase) GetLatest(deviceID uuid.UUID) (*entities.SensorReading, error) {
	return uc.SensorRepo.GetLatestByDeviceID(deviceID)
}

func (uc *SensorUseCase) GetHistory(deviceID uuid.UUID, start, end string) ([]entities.SensorReading, error) {
	return uc.SensorRepo.GetHistory(deviceID, start, end)
}

func (uc *SensorUseCase) checkHazards(deviceID uuid.UUID, sensorType string, data map[string]interface{}) {
	// Gas Sensor Checks
	if sensorType == "gas" {
		if val, ok := data["co2"].(float64); ok && val > 1000 {
			uc.createAlert(deviceID, "Gas Hazard", "High", "Critical CO2 levels detected!")
		}
		if val, ok := data["methane"].(float64); ok && val > 500 {
			uc.createAlert(deviceID, "Gas Hazard", "Critical", "Explosive Methane levels detected!")
		}
	}

	// Temperature Sensor Checks
	if sensorType == "temperature" {
		if val, ok := data["temp"].(float64); ok && val > 45 {
			uc.createAlert(deviceID, "Heat Hazard", "Medium", "High temperature detected!")
		}
	}

	// Vibration/Motion Checks
	if sensorType == "vibration" {
		if val, ok := data["g_force"].(float64); ok && val > 2.5 {
			uc.createAlert(deviceID, "Seismic Hazard", "High", "Strong vibration/impact detected!")
		}
	}
}

func (uc *SensorUseCase) createAlert(deviceID uuid.UUID, alertType, severity, message string) {
	alert := &entities.Alert{
		DeviceID:  deviceID,
		AlertType: alertType,
		Severity:  severity,
		Message:   message,
		CreatedAt: time.Now(),
	}
	// Log error if alert creation fails, but don't stop flow
	_ = uc.AlertRepo.Create(alert)
}

func (uc *SensorUseCase) GetReadingsByDevice(deviceID uuid.UUID) ([]entities.SensorReading, error) {
	return uc.SensorRepo.FindByDeviceID(deviceID)
}
