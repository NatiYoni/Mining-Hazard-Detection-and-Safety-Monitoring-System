package usecases

import (
	"minesense-backend/domain/entities"
	"minesense-backend/domain/interfaces"
	"time"

	"github.com/google/uuid"
)

type ImageUseCase struct {
	ImageRepo interfaces.ImageRepository
}

func NewImageUseCase(imageRepo interfaces.ImageRepository) *ImageUseCase {
	return &ImageUseCase{ImageRepo: imageRepo}
}

func (uc *ImageUseCase) SaveImage(deviceID uuid.UUID, imageURL string) (*entities.Image, error) {
	image := &entities.Image{
		DeviceID:  deviceID,
		ImageURL:  imageURL,
		CreatedAt: time.Now(),
	}
	err := uc.ImageRepo.Create(image)
	return image, err
}

func (uc *ImageUseCase) GetImage(id uuid.UUID) (*entities.Image, error) {
	return uc.ImageRepo.FindByID(id)
}

func (uc *ImageUseCase) GetLatest(deviceID uuid.UUID) (*entities.Image, error) {
	return uc.ImageRepo.GetLatestByDeviceID(deviceID)
}
