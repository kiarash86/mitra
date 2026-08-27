package main

import (
	"context"
	"log"

	"github.com/kiarash86/mitra/internal/config"
)


func main() {

	cfg , err := config.Load()
	if err != nil {
		log.Fatalf("couldnt load config : %v" , err)
	}	

	ctx , cancel := context.WithCancel(context.Background())
	defer cancel()

}