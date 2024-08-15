package parser

import (
	"errors"
	"mime"
	"path"
	"strings"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
)

func ParseMetadataFromPath(config config.UserSettings, filePath string) (internal.Metadata, []error) {
	var errors []error
	compilationArtistNames := internal.Fmap(
		append(config.Compilations.Artists, internal.CompilationKeyword),
		func(a string, _ int) string {
			return strings.ToLower(a)
		})
	mime, mimeError := getTypeFromPath(filePath)

	if mimeError != nil {
		errors = append(errors, mimeError)
	}
	mime = mime
	compilationArtistNames = compilationArtistNames
	return internal.Metadata{}, errors

}

func getTypeFromPath(filePath string) (internal.TrackType, error) {
	stringMime := mime.TypeByExtension(path.Ext(filePath))

	if strings.HasPrefix(stringMime, "video/") {
		return internal.Video, nil
	}
	if strings.HasPrefix(stringMime, "audio/") {
		return internal.Audio, nil
	}
	return "", errors.New("could not identify the MIME of the file")
}
