package cmd

import (
	"log"
	"os"

	"github.com/kiarash86/mitra/internal/config"
	"github.com/spf13/cobra"
)

var cfg *config.Config

var rootCmd = &cobra.Command{
	Use:   "mitra",
	Short: "Mitra API server and operational tooling",
	PersistentPreRun: func(cmd *cobra.Command, args []string) {
		config, err := config.Load()
		if err != nil {
			log.Fatalf("couldnt load config: %v", err)
		}
		cfg = config
	},
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}
