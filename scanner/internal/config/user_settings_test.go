package config

import (
	"fmt"
	"github.com/stretchr/testify/assert"
	"path"
	"testing"
)

// settingsName is the file name without extension
func getTestConfig(settingsName string) (UserSettings, []error) {
	settingsPath := path.Join("../../", "testdata", "user_settings", fmt.Sprintf("%s.json", settingsName))
	return GetUserSettings(settingsPath)
}

func TestValidSettings(t *testing.T) {
	s, errors := getTestConfig("settings")

	assert.Empty(t, errors)
	assert.Equal(t, MetadataSource("embedded"), s.Metadata.Source)
	assert.Equal(t, MetadataParsingOrder("only"), s.Metadata.Order)
	assert.Equal(t, true, s.Compilations.UseID3CompTag)
	assert.Empty(t, s.Compilations.Artists)
	assert.Equal(t, 2, len(s.TrackRegex))
}

func TestValidSettings2(t *testing.T) {
	s, errors := getTestConfig("settings2")

	assert.Empty(t, errors)
	assert.Equal(t, MetadataSource("path"), s.Metadata.Source)
	assert.Equal(t, MetadataParsingOrder("preferred"), s.Metadata.Order)
	assert.Equal(t, true, s.Compilations.UseID3CompTag)
	assert.Empty(t, s.Compilations.Artists)
	assert.Equal(t, 1, len(s.TrackRegex))
}

func TestEmptyFile(t *testing.T) {
	_, errors := getTestConfig("settings-empty")

	assert.Len(t, errors, 1)
}

func TestNoRegex(t *testing.T) {
	_, errors := getTestConfig("settings-empty-regex")

	assert.Len(t, errors, 1)
}

func TestInvalidJson(t *testing.T) {
	_, errors := getTestConfig("settings-invalid")

	assert.Len(t, errors, 1)
}
func TestMissingMetadataOrder(t *testing.T) {
	_, errors := getTestConfig("settings-missing-metadata-order")

	assert.Len(t, errors, 1)
}

func TestMissingMetadataSource(t *testing.T) {
	_, errors := getTestConfig("settings-missing-metadata-source")

	assert.Len(t, errors, 1)
}

func TestMissingMetadata(t *testing.T) {
	_, errors := getTestConfig("settings-missing-metadata")

	assert.Len(t, errors, 1)
}

func TestMissingRegex(t *testing.T) {
	_, errors := getTestConfig("settings-missing-regex")

	assert.Len(t, errors, 1)
}

func TestWrongMetadataSourceType(t *testing.T) {
	_, errors := getTestConfig("settings-wrong-type-metadata-source")

	assert.Len(t, errors, 1)
}

func TestWrongMetadataType(t *testing.T) {
	_, errors := getTestConfig("settings-wrong-type")

	assert.Len(t, errors, 1)
}
