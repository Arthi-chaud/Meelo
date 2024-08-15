package config

import (
	"fmt"
	"os"

	"github.com/kpango/glg"
)

type Config struct {
	// URL to the API
	ApiUrl string
	// Path to the folder that contains the settings.json
	ConfigDirectory string
	// Path to the folder where all the libraries are
	DataDirectory string
}

// Parses and return a config from the CLI args and env args
func GetConfig() Config {
	var config Config
	var errors []string

	apiUrl := getEnvVarOrPushError("API_URL", &errors)
	configDir := getEnvVarOrPushError("INTERNAL_CONFIG_DIR", &errors)
	dataDir := getEnvVarOrPushError("INTERNAL_DATA_DIR", &errors)

	if len(errors) != 0 {
		for _, errorMsg := range errors {
			glg.Fail(errorMsg)
		}
		glg.Fatalf("Errors occured while parsing configuration. exiting...")
	}
	config.ApiUrl = apiUrl
	config.ConfigDirectory = configDir
	config.DataDirectory = dataDir
	glg.Success("Configuration parsed successfully")
	return config
}

func getEnvVarOrPushError(envVar string, errors *[]string) string {
	value, is_present := os.LookupEnv(envVar)
	if !is_present || len(value) == 0 {
		*errors = append(*errors, fmt.Sprintf("%s is missing or empty.", envVar))
	}
	return value
}
