package usecases

import (
	"errors"
	"minesense-backend/domain/entities"
	"minesense-backend/domain/interfaces"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type UserUseCase struct {
	UserRepo interfaces.UserRepository
}

func NewUserUseCase(userRepo interfaces.UserRepository) *UserUseCase {
	return &UserUseCase{UserRepo: userRepo}
}

func (uc *UserUseCase) Register(username, password, role string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user := &entities.User{
		Username:  username,
		Password:  string(hashedPassword),
		Role:      role,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return uc.UserRepo.Create(user)
}

func (uc *UserUseCase) Login(username, password string) (*entities.User, error) {
	user, err := uc.UserRepo.FindByUsername(username)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	return user, nil
}
