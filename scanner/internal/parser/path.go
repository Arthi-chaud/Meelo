package parser

import (
	"errors"
	"fmt"
	"mime"
	"path"
	"regexp"
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
	trackType, mimeError := getTypeFromPath(filePath)

	if mimeError != nil {
		errors = append(errors, mimeError)
	}
	var matches []string
	var regex *regexp.Regexp
	for _, tregex := range config.TrackRegex {
		regex := regexp.MustCompile(tregex)
		matches := regex.FindStringSubmatch(filePath)
		if len(matches) != 0 {
			break
		} else {
			regex = nil
		}
	}
	if regex == nil {
		errors = append(errors, fmt.Errorf("file did not match any regexes: '%s'", filePath))
		return internal.Metadata{}, errors
	}
	metadata, metadataErrors := getMetadataFromMatches(matches, regex)

	errors = append(errors, metadataErrors...)
	metadata.IsCompilation = internal.Contains(compilationArtistNames, metadata.AlbumArtist) ||
		internal.Contains(compilationArtistNames, metadata.Artist)
	metadata.Type = trackType
	return metadata, errors

}

func getMetadataFromMatches(matches []string, regex *regexp.Regexp) (internal.Metadata, []error) {
	//TODO
	return internal.Metadata{}, []error{}
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
