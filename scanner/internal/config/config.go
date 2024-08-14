package config

import (
	"os"

	"github.com/kpango/glg"
)

type Config struct {
	// URL to the API
	ApiUrl string
}

// Parses and return a config from the CLI args and env args
func GetConfig() Config {
	var config Config

	apiUrl, is_present := os.LookupEnv("API_URL")
	if !is_present || len(apiUrl) == 0 {
		glg.Fatalf("API_URL is missing or empty.")
		os.Exit(1)
	}

	config.ApiUrl = apiUrl
	glg.Success("Configuration parsed successfully")
	return config
}
