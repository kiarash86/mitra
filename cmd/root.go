package cmd

import (
	"log"

	"github.com/kiarash86/mitra/internal/config"
	"github.com/spf13/cobra"
)

var cfg *config.Config

var rootCmd = &cobra.Command{
	Use:   "mitra",
	Short: "Mitra API server and operational tooling",
	Run: func(cmd *cobra.Command, args []string) {
		config, err := config.Load()
		if err != nil {
			log.Fatalf("couldnt load config: %v", err)
		}
		cfg = config
	},
}
