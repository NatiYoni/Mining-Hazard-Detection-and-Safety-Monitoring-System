package entities

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type SensorReading struct {
	ID         uuid.UUID       `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	DeviceID   uuid.UUID       `gorm:"type:uuid;not null" json:"device_id"`
	SensorType string          `gorm:"not null" json:"sensor_type"` // e.g., "gas", "temperature", "vibration"
	Payload    json.RawMessage `gorm:"type:jsonb" json:"payload"`
	Timestamp  time.Time       `json:"timestamp"`
	Device     Device          `gorm:"foreignKey:DeviceID" json:"-"`
}
