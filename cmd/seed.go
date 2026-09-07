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

func firstNonEmpty(flagValue, envValue string) string {
	if flagValue != "" {
		return flagValue
	}
	return envValue
}

func init() {

	seedCmd.Flags().StringVar(&seedOrgName, "org-name", "", "organization name (defaults to ORG_NAME)")
	seedCmd.Flags().StringVar(&seedOrgSlug, "org-slug", "", "organization slug (defaults to ORG_SLUG)")
	seedCmd.Flags().StringVar(&seedOwnerEmail, "owner-email", "", "owner login email (defaults to OWNER_EMAIL)")
	seedCmd.Flags().StringVar(&seedOwnerName, "owner-name", "", "owner full name (defaults to OWNER_NAME)")
	seedCmd.Flags().StringVar(&seedOwnerPassword, "owner-password", "", "owner initial password (defaults to OWNER_PASSWORD)")

	rootCmd.AddCommand(seedCmd)
}
