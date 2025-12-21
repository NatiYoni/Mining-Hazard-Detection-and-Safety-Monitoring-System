package entities

import (
	"time"

	"github.com/google/uuid"
)

type Image struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	DeviceID  uuid.UUID `gorm:"type:uuid;not null" json:"device_id"`
	ImageURL  string    `gorm:"not null" json:"image_url"`
	CreatedAt time.Time `json:"created_at"`
	Device    Device    `gorm:"foreignKey:DeviceID" json:"-"`
}
