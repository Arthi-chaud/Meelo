package config

import (
	e "errors"
	"os"
	"regexp"
	"strings"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/go-playground/validator/v10"
	"github.com/goccy/go-json"
)

const UserSettingsFileName = "settings.json"

type CompilationSettings struct {
	Artists       []string `json:"artists"`
	UseID3CompTag bool     `json:"useID3CompTag"`
}

type MetadataSettings struct {
	Source MetadataSource       `json:"source" validate:"required,oneof=path embedded"`
	Order  MetadataParsingOrder `json:"order" validate:"required,oneof=only preferred"`
}

type MetadataSource string

const (
	Path     MetadataSource = "path"
	Embedded MetadataSource = "embedded"
)

type MetadataParsingOrder string

const (
	Only      MetadataParsingOrder = "only"
	Preferred MetadataParsingOrder = "preferred"
)

type UserSettings struct {
	Compilations          CompilationSettings `json:"compilations" validate:"required"`
	TrackRegex            []string            `json:"trackRegex" validate:"required"`
	Metadata              MetadataSettings    `json:"metadata" validate:"required"`
	UseEmbeddedThumbnails bool                `json:"useEmbeddedThumbnails"`
}

func GetUserSettings(settingsFilePath string) (UserSettings, []error) {
	bytes, err := os.ReadFile(settingsFilePath)
	var errors []error
	if err != nil {
		return UserSettings{}, []error{e.New("could not read configuration file")}
	}
	var userSettings UserSettings

	jsonErr := json.Unmarshal(bytes, &userSettings)
	if jsonErr != nil {
		return UserSettings{}, []error{jsonErr}
	}
	validationsErrs := validator.New(validator.WithRequiredStructEnabled()).Struct(userSettings)
	errors = append(errors, internal.PrettifyValidationError(validationsErrs, "user settings")...)
	if len(errors) > 0 {
		return UserSettings{}, errors
	}
	for _, artistValue := range userSettings.Compilations.Artists {
		if len(strings.TrimSpace(artistValue)) == 0 {
			errors = append(errors, e.New("user settings: compilations.artists contains empty strings"))
			break
		}
	}
	if len(userSettings.TrackRegex) < 1 {
		errors = append(errors, e.New("user settings: trackRegex is empty"))
	}
	for _, regex := range userSettings.TrackRegex {
		_, regexError := regexp.Compile(regex)
		if regexError != nil {
			errors = append(errors, regexError)
		}
	}
	return userSettings, errors
}
