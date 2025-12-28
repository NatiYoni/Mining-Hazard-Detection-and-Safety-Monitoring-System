package database

import (
	"minesense-backend/domain/entities"
	"minesense-backend/domain/interfaces"

	"gorm.io/gorm"
)

type UserRepo struct {
	DB *gorm.DB
}

func NewUserRepo(db *gorm.DB) interfaces.UserRepository {
	return &UserRepo{DB: db}
}

func (r *UserRepo) Create(user *entities.User) error {
	return r.DB.Create(user).Error
}

func (r *UserRepo) FindByUsername(username string) (*entities.User, error) {
	var user entities.User
	err := r.DB.Where("username = ?", username).First(&user).Error
	return &user, err
}

func (r *UserRepo) Update(user *entities.User) error {
	return r.DB.Save(user).Error
}
