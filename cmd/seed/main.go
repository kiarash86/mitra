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
}

func getEnv(key string) string {
	env := os.Getenv(key)
	if env == "" {
		log.Fatalf("missing env parameter: %s", key)
	}

	return env
}
