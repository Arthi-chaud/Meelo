package config

import (
	"fmt"
	"os"
	"regexp"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/goccy/go-json"
)

const UserSettingsFileName = "settings.json"

type CompilationSettings struct {
	Artists       []string `json:"extras"`
	UseID3CompTag bool     `json:"useID3CompTag" validate:"required"`
}

type MetadataSettings struct {
	Source MetadataSource       `json:"source" validate:"required,oneof=path embedded"`
	Order  MetadataParsingOrder `json:"order" validate:"required,oneof=only preferred"`
}

type MetadataSource string

const (
	Path     = "path"
	Embedded = "embedded"
)

type MetadataParsingOrder string

const (
	Only      = "only"
	Preferred = "preferred"
)

type UserSettings struct {
	Compilations CompilationSettings `json:"compilations" validate:"required"`
	TrackRegex   []string            `json:"trackRegex" validate:"required"`
	Metadata     MetadataSettings    `json:"metadata" validate:"required"`
}

func GetUserSettings(settingsFilePath string) (UserSettings, []string) {
	bytes, err := os.ReadFile(settingsFilePath)
	var errors []string
	if err != nil {
		return UserSettings{}, []string{"Could not read configuration file."}
	}
	var userSettings UserSettings

	jsonErr := json.Unmarshal(bytes, &userSettings)
	if jsonErr != nil {
		return UserSettings{}, []string{jsonErr.Error()}
	}
	validationsErrs := validator.New(validator.WithRequiredStructEnabled()).Struct(userSettings)
	if validationsErrs != nil {
		for _, validationErr := range validationsErrs.(validator.ValidationErrors) {
			var errMsg = fmt.Sprintf(
				"User Settings validation failed for '%s'. Constraint: %s(%s), Got '%s'\n",
				validationErr.StructNamespace(), validationErr.Tag(),
				validationErr.Param(), validationErr.Value(),
			)
			errors = append(errors, errMsg)
		}
		return UserSettings{}, errors
	}
	for _, artistValue := range userSettings.Compilations.Artists {
		if len(strings.TrimSpace(artistValue)) == 0 {
			errors = append(errors, "User Settings: compilations.artists contains empty strings")
			break
		}
	}
	if len(userSettings.TrackRegex) < 1 {
		errors = append(errors, "User Settings: trackRegex is empty")
	}
	for _, regex := range userSettings.TrackRegex {
		_, regexError := regexp.Compile(regex)
		if regexError != nil {
			errors = append(errors, regexError.Error())
		}
	}
	return userSettings, errors
}
