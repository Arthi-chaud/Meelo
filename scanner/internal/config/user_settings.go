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

	json_error := json.Unmarshal(bytes, &userSettings)
	if json_error != nil {
		return UserSettings{}, []string{json_error.Error()}
	}
	validation_error := validator.New(validator.WithRequiredStructEnabled()).Struct(userSettings)
	if validation_error != nil {
		for _, validation_error := range validation_error.(validator.ValidationErrors) {
			var error_message = fmt.Sprintf(
				"User Settings validation failed for '%s'. Constraint: %s(%s), Got '%s'\n",
				validation_error.StructNamespace(), validation_error.Tag(),
				validation_error.Param(), validation_error.Value(),
			)
			errors = append(errors, error_message)
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
