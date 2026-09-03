package main

import (
	"log"
	"os"

	"github.com/kiarash86/mitra/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("couldnt load config: %v", err)
	}

	orgName := getEnv("ORG_NAME")
	orgSlug := getEnv("ORG_SLUG")
	ownerEmail := getEnv("OWNER_EMAIL")
	ownerName := getEnv("OWNER_NAME")
	ownerPassword := getEnv("OWNER_PASSWORD")
}

func getEnv(key string) string {
	env := os.Getenv(key)
	if env == "" {
		log.Fatalf("missing env parameter: %s", key)
	}

	return env
}
