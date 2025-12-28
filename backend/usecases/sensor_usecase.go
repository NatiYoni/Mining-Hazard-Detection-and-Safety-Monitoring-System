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

func (uc *SensorUseCase) ProcessSensorData(deviceID uuid.UUID, sensorType string, payload json.RawMessage) ([]*entities.Alert, error) {
	reading := &entities.SensorReading{
		DeviceID:   deviceID,
		SensorType: sensorType,
		Payload:    payload,
		Timestamp:  time.Now(),
	}

	if err := uc.SensorRepo.Create(reading); err != nil {
		return nil, err
	}

	// Hazard Detection
	var alerts []*entities.Alert
	var data map[string]interface{}
	if err := json.Unmarshal(payload, &data); err == nil {
		alerts = uc.checkHazards(deviceID, sensorType, data)
	}

	return alerts, nil
}

func (uc *SensorUseCase) GetLatest(deviceID uuid.UUID) (*entities.SensorReading, error) {
	return uc.SensorRepo.GetLatestByDeviceID(deviceID)
}

func (uc *SensorUseCase) GetHistory(deviceID uuid.UUID, start, end string) ([]entities.SensorReading, error) {
	return uc.SensorRepo.GetHistory(deviceID, start, end)
}

func (uc *SensorUseCase) checkHazards(deviceID uuid.UUID, sensorType string, data map[string]interface{}) []*entities.Alert {
	var alerts []*entities.Alert

	// Combined Telemetry or Individual Checks
	// We check for keys regardless of sensorType to be robust, or strictly if sensorType is "telemetry"

	// 1. Gas Sensor (MQ-2)
	// Threshold: > 700 PPM -> Critical
	if val, ok := data["gas"].(float64); ok {
		if val > 700 {
			if alert := uc.createAlert(deviceID, "Gas Hazard", "Critical", "Dangerous Gas Levels (>700 PPM) detected! Evacuate!"); alert != nil {
				alerts = append(alerts, alert)
			}
		}
	}

	// 2. Temperature Sensor (DHT-22)
	// Thresholds: > 38°C (Critical), > 31°C (Caution)
	if val, ok := data["temp"].(float64); ok {
		if val > 38 {
			if alert := uc.createAlert(deviceID, "Heat Stress", "Critical", "Critical Heat (>38°C)! Mandatory removal from area."); alert != nil {
				alerts = append(alerts, alert)
			}
		} else if val > 31 {
			if alert := uc.createAlert(deviceID, "Heat Stress", "Caution", "High Heat (>31°C). Hydration and rest suggested."); alert != nil {
				alerts = append(alerts, alert)
			}
		}
	}

	// 3. Fall Detection (MPU-6050)
	// Boolean flag from device
	if val, ok := data["fall"].(bool); ok && val {
		if alert := uc.createAlert(deviceID, "Man-Down", "Critical", "Fall detected! Man-down event initiated."); alert != nil {
			alerts = append(alerts, alert)
		}
	}

	// 4. Structural/Vibration (Piezo)
	// Assuming "vibration" key or similar if sent
	if val, ok := data["vibration"].(float64); ok && val > 500 { // Threshold example, adjust as needed
		if alert := uc.createAlert(deviceID, "Structural Warning", "High", "High-frequency vibration detected!"); alert != nil {
			alerts = append(alerts, alert)
		}
	}

	return alerts
}

func (uc *SensorUseCase) createAlert(deviceID uuid.UUID, alertType, severity, message string) *entities.Alert {
	alert := &entities.Alert{
		DeviceID:  deviceID,
		AlertType: alertType,
		Severity:  severity,
		Message:   message,
		CreatedAt: time.Now(),
	}
	// Log error if alert creation fails, but don't stop flow
	if err := uc.AlertRepo.Create(alert); err != nil {
		return nil
	}
	return alert
}

func (uc *SensorUseCase) GetReadingsByDevice(deviceID uuid.UUID) ([]entities.SensorReading, error) {
	return uc.SensorRepo.FindByDeviceID(deviceID)
}
