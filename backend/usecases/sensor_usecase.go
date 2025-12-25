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
	// Combined Telemetry or Individual Checks
	// We check for keys regardless of sensorType to be robust, or strictly if sensorType is "telemetry"

	// 1. Gas Sensor (MQ-2)
	// Threshold: > 700 PPM -> Critical
	if val, ok := data["gas"].(float64); ok {
		if val > 700 {
			uc.createAlert(deviceID, "Gas Hazard", "Critical", "Dangerous Gas Levels (>700 PPM) detected! Evacuate!")
		}
	}

	// 2. Temperature Sensor (DHT-22)
	// Thresholds: > 38°C (Critical), > 31°C (Caution)
	if val, ok := data["temp"].(float64); ok {
		if val > 38 {
			uc.createAlert(deviceID, "Heat Stress", "Critical", "Critical Heat (>38°C)! Mandatory removal from area.")
		} else if val > 31 {
			uc.createAlert(deviceID, "Heat Stress", "Caution", "High Heat (>31°C). Hydration and rest suggested.")
		}
	}

	// 3. Fall Detection (MPU-6050)
	// Boolean flag from device
	if val, ok := data["fall"].(bool); ok && val {
		uc.createAlert(deviceID, "Man-Down", "Critical", "Fall detected! Man-down event initiated.")
	}

	// 4. Structural/Vibration (Piezo)
	// Assuming "vibration" key or similar if sent
	if val, ok := data["vibration"].(float64); ok && val > 500 { // Threshold example, adjust as needed
		uc.createAlert(deviceID, "Structural Warning", "High", "High-frequency vibration detected!")
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
