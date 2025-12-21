package usecases

import (
	"minesense-backend/domain/entities"
	"minesense-backend/domain/interfaces"

	"github.com/google/uuid"
)

type AlertUseCase struct {
	AlertRepo interfaces.AlertRepository
}

func NewAlertUseCase(alertRepo interfaces.AlertRepository) *AlertUseCase {
	return &AlertUseCase{AlertRepo: alertRepo}
}

func (uc *AlertUseCase) GetAllAlerts() ([]entities.Alert, error) {
	return uc.AlertRepo.FindAll()
}

func (uc *AlertUseCase) GetAlertsByDevice(deviceID uuid.UUID) ([]entities.Alert, error) {
	return uc.AlertRepo.FindByDeviceID(deviceID)
}
