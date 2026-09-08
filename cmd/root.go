package cmd

import (
	"fmt"
	"os"

	"github.com/kiarash86/mitra/internal/config"
	"github.com/spf13/cobra"
)

var version = "dev"

var cfg *config.Config

var rootCmd = &cobra.Command{
	Use:          "mitra",
	Short:        "Mitra API server and operational tooling",
	Version:      version,
	SilenceUsage: true,
	PersistentPreRunE: func(cmd *cobra.Command, args []string) error {
		config, err := config.Load()
		if err != nil {
			return fmt.Errorf("couldnt load config: %w", err)
		}
		cfg = config
		return nil
	},
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}
