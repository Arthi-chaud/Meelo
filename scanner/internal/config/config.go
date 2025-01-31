package config

import (
	"fmt"
	"os"
	"path"
	"strings"

	"github.com/rs/zerolog/log"
)

type Config struct {
	// Access token of the user who have requested something
	// Optional
	AccessToken string
	// URL to the API
	ApiUrl string
	// Key we will use to authenticate to the API
	ApiKey string
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
	apiKey := getApiKeyFromEnvOrPushError(&errors)
	configDir := getEnvVarOrPushError("INTERNAL_CONFIG_DIR", &errors)
	dataDir := getEnvVarOrPushError("INTERNAL_DATA_DIR", &errors)
	userSettings, userSettingsErrors := GetUserSettings(path.Join(configDir, UserSettingsFileName))

	errors = append(errors, userSettingsErrors...)
	if len(errors) != 0 {
		log.Error().Msg("Errors occured while parsing configuration. Exiting...")
		for _, errorMsg := range errors {
			log.Error().Msg(errorMsg.Error())
		}
		os.Exit(1)
	}
	config.ApiUrl = apiUrl
	config.ApiKey = apiKey
	config.ConfigDirectory = configDir
	config.DataDirectory = dataDir
	config.UserSettings = userSettings
	log.Info().Msg("Configuration parsed successfully")
	return config
}

func getEnvVarOrPushError(envVar string, errors *[]error) string {
	value, isPresent := os.LookupEnv(envVar)
	if !isPresent || len(value) == 0 {
		*errors = append(*errors, fmt.Errorf("%s is missing or empty", envVar))
	}
	return value
}

func getApiKeyFromEnvOrPushError(errors *[]error) string {
	localErrors := []error{}
	apiKey := getEnvVarOrPushError("API_KEY", &localErrors)
	if len(apiKey) != 0 {
		return apiKey
	}
	localErrors = []error{}
	apiKeys := getEnvVarOrPushError("API_KEYS", &localErrors)
	*errors = append(*errors, localErrors...)
	return strings.Split(apiKeys, ",")[0]
}
