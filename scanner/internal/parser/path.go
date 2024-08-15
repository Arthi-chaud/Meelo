package parser

import (
	"errors"
	"fmt"
	"mime"
	"path"
	"regexp"
	"strconv"
	"strings"
	"time"

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
	if metadata.IsCompilation {
		metadata.AlbumArtist = ""
	}
	metadata.Type = trackType
	return metadata, errors
}

func getMetadataFromMatches(matches []string, regex *regexp.Regexp) (internal.Metadata, []error) {
	var metadata internal.Metadata
	var errors []error

	if index := regex.SubexpIndex("AlbumArtist"); index != -1 {
		metadata.AlbumArtist = matches[index]
	}
	if index := regex.SubexpIndex("Artist"); index != -1 {
		metadata.Artist = matches[index]
	}
	if index := regex.SubexpIndex("Release"); index != -1 {
		metadata.Release = matches[index]
	}
	if index := regex.SubexpIndex("Album"); index != -1 {
		metadata.Album = matches[index]
	}
	if index := regex.SubexpIndex("Year"); index != -1 {
		date, err := time.Parse("2006", matches[index])
		if err == nil {
			metadata.ReleaseDate = date
		} else {
			errors = append(errors, fmt.Errorf("invalid year: '%s'", matches[index]))
		}
	}
	if index := regex.SubexpIndex("Disc"); index != -1 {
		value, err := strconv.Atoi(matches[index])
		if err == nil {
			metadata.DiscIndex = int64(value)
		} else {
			errors = append(errors, fmt.Errorf("invalid disc index: '%s'", matches[index]))
		}
	}
	if index := regex.SubexpIndex("Index"); index != -1 {
		value, err := strconv.Atoi(matches[index])
		if err == nil {
			metadata.Index = int64(value)
		} else {
			errors = append(errors, fmt.Errorf("invalid track index: '%s'", matches[index]))
		}
	}
	if index := regex.SubexpIndex("Track"); index != -1 {
		metadata.Name = matches[index]
	}
	if index := regex.SubexpIndex("Genre"); index != -1 {
		metadata.Genres = []string{matches[index]}
	}
	if index := regex.SubexpIndex("DiscogsId"); index != -1 {
		metadata.DiscogsId = matches[index]
	}
	return metadata, errors
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
