package cmd

import (

	"github.com/spf13/cobra"
)

var (
	seedOrgName       string
	seedOrgSlug       string
	seedOwnerEmail    string
	seedOwnerName     string
	seedOwnerPassword string
)

var seedCmd = &cobra.Command{
	Use:   "seed",
	Short: "Create the first organization and owner account",
	Run: func(cmd *cobra.Command, args []string) {
		runSeed()
	},
}
