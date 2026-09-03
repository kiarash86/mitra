package main

import (
	"log"

	"github.com/kiarash86/mitra/internal/config"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("couldnt load config: %v", err)
	}
}
