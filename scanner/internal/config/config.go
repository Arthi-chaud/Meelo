package config

import (
	"fmt"
	"github.com/kpango/glg"
	"os"
	"path"
)

type Config struct {
	// URL to the API
	ApiUrl string
	// Path to the folder that contains the settings.json
	ConfigDirectory string
	// Path to the folder where all the libraries are
	DataDirectory string
	UserSettings  UserSettings
}

// Parses and return a config from the CLI args and env args
func GetConfig() Config {
	var config Config
	var errors []error

	apiUrl := getEnvVarOrPushError("API_URL", &errors)
	configDir := getEnvVarOrPushError("INTERNAL_CONFIG_DIR", &errors)
	dataDir := getEnvVarOrPushError("INTERNAL_DATA_DIR", &errors)
	userSettings, userSettingsErrors := GetUserSettings(path.Join(configDir, UserSettingsFileName))

	errors = append(errors, userSettingsErrors...)
	if len(errors) != 0 {
		for _, errorMsg := range errors {
			glg.Fail(errorMsg)
		}
		glg.Fatalf("Errors occured while parsing configuration. Exiting...")
	}
	config.ApiUrl = apiUrl
	config.ConfigDirectory = configDir
	config.DataDirectory = dataDir
	config.UserSettings = userSettings
	glg.Success("Configuration parsed successfully")
	return config
}

func getEnvVarOrPushError(envVar string, errors *[]error) string {
	value, isPresent := os.LookupEnv(envVar)
	if !isPresent || len(value) == 0 {
		*errors = append(*errors, fmt.Errorf("%s is missing or empty", envVar))
	}
	return value
}
