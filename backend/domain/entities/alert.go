package entities

import (
	"time"

	"github.com/google/uuid"
)

type Alert struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	DeviceID  uuid.UUID `gorm:"type:uuid;not null" json:"device_id"`
	AlertType string    `gorm:"not null" json:"alert_type"` // e.g., "Critical", "Warning"
	Severity  string    `gorm:"not null" json:"severity"`   // e.g., "High", "Medium", "Low"
	Message   string    `gorm:"not null" json:"message"`
	CreatedAt time.Time `json:"created_at"`
	Device    Device    `gorm:"foreignKey:DeviceID" json:"-"`
}
