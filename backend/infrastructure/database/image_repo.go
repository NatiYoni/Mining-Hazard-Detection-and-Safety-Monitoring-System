package database

import (
	"minesense-backend/domain/entities"
	"minesense-backend/domain/interfaces"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ImageRepo struct {
	DB *gorm.DB
}

func NewImageRepo(db *gorm.DB) interfaces.ImageRepository {
	return &ImageRepo{DB: db}
}

func (r *ImageRepo) Create(image *entities.Image) error {
	return r.DB.Create(image).Error
}

func (r *ImageRepo) FindByID(id uuid.UUID) (*entities.Image, error) {
	var image entities.Image
	err := r.DB.First(&image, "id = ?", id).Error
	return &image, err
}

func (r *ImageRepo) GetLatestByDeviceID(deviceID uuid.UUID) (*entities.Image, error) {
	var image entities.Image
	err := r.DB.Where("device_id = ?", deviceID).Order("timestamp desc").First(&image).Error
	return &image, err
}
