package auth

import (
	"crypto/rand"
	"math/big"

	"golang.org/x/crypto/bcrypt"
)

const bcryptCost = 12
const tempPasswordLength = 12
const tempPasswordAlphabet = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ"

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

func CheckPassword(hash string, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	if err != nil {
		return false
	}
	return true
}

func GenerateTempPassword() (string, error) {
	password := make([]byte, tempPasswordLength)
	for i := range password {
		number, err := rand.Int(
			rand.Reader,
			big.NewInt(int64(len(tempPasswordAlphabet))),
		)
		if err != nil {
			return "", err
		}
		password[i] = tempPasswordAlphabet[number.Int64()]
	}

	return string(password), nil
}
