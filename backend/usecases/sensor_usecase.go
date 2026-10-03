package usecases

import (
	"encoding/json"
	"errors"
	"fmt"
	"minesense-backend/domain/entities"
	"minesense-backend/domain/interfaces"
	"time"

	"github.com/google/uuid"
)

var ErrInvalidSensorPayload = errors.New("sensor payload must be a JSON object")

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
	var data map[string]interface{}
	if err := json.Unmarshal(payload, &data); err != nil || data == nil {
		return nil, ErrInvalidSensorPayload
	}

	reading := &entities.SensorReading{
		DeviceID:   deviceID,
		SensorType: sensorType,
		Payload:    payload,
		Timestamp:  time.Now(),
	}

	if err := uc.SensorRepo.Create(reading); err != nil {
		return nil, err
	}

	alerts := uc.checkHazards(deviceID, sensorType, data)
	for _, alert := range alerts {
		if err := uc.AlertRepo.Create(alert); err != nil {
			return nil, fmt.Errorf("create %s alert: %w", alert.AlertType, err)
		}
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
			alerts = append(alerts, newAlert(deviceID, "Gas Hazard", "Critical", "Dangerous Gas Levels (>700 PPM) detected! Evacuate!"))
		}
	}

	// 2. Temperature Sensor (DHT-22)
	// Thresholds: > 25°C (Critical), > 24°C (Caution)
	if val, ok := data["temp"].(float64); ok {
		if val > 25 {
			alerts = append(alerts, newAlert(deviceID, "Heat Stress", "Critical", "Critical Heat (>25°C)! Mandatory removal from area."))
		} else if val > 24 {
			alerts = append(alerts, newAlert(deviceID, "Heat Stress", "Warning", "High Heat (>24°C). Hydration and rest suggested."))
		}
	}

	// 3. Fall Detection (MPU-6050)
	// Boolean flag from device
	if val, ok := data["fall"].(bool); ok && val {
		alerts = append(alerts, newAlert(deviceID, "Man-Down", "Critical", "Fall detected! Man-down event initiated."))
	}

	// 4. Structural/Vibration (Piezo)
	// Assuming "vibration" key or similar if sent
	if val, ok := data["vibration"].(float64); ok && val > 500 { // Threshold example, adjust as needed
		alerts = append(alerts, newAlert(deviceID, "Structural Warning", "High", "High-frequency vibration detected!"))
	}

	return alerts
}

func newAlert(deviceID uuid.UUID, alertType, severity, message string) *entities.Alert {
	return &entities.Alert{
		DeviceID:  deviceID,
		AlertType: alertType,
		Severity:  severity,
		Message:   message,
		CreatedAt: time.Now(),
	}
}

func (uc *SensorUseCase) GetReadingsByDevice(deviceID uuid.UUID) ([]entities.SensorReading, error) {
	return uc.SensorRepo.FindByDeviceID(deviceID)
}
