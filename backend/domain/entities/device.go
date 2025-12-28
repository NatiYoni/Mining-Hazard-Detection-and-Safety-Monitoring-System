package entities

import (
	"time"

	"github.com/google/uuid"
)

type Device struct {
	ID           uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	DeviceName   string    `gorm:"not null" json:"device_name"`
	Location     string    `json:"location"`
	SupervisorID *uuid.UUID `gorm:"type:uuid" json:"supervisor_id"` // Pointer to allow null
	Supervisor   *User      `gorm:"foreignKey:SupervisorID" json:"supervisor,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
