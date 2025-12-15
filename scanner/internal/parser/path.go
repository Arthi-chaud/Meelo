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
	"github.com/Arthi-chaud/Meelo/scanner/internal/illustration"
)

func parseMetadataFromPath(config config.UserSettings, filePath string) (internal.Metadata, []error) {
	var errors []error
	var matches []string
	var regex *regexp.Regexp
	for _, tregex := range config.TrackRegex {
		regex = regexp.MustCompile(tregex)
		matches = regex.FindStringSubmatch(filePath)
		if len(matches) != 0 {
			break
		} else {
			regex = nil
		}
	}
	if len(matches) == 0 {
		errors = append(errors, fmt.Errorf("file did not match any regexes: '%s'", filePath))
		return internal.Metadata{}, errors
	}

	metadata, metadataErrors := getMetadataFromMatches(matches, regex)
	errors = append(errors, metadataErrors...)

	trackType, mimeError := getTypeFromPath(filePath)
	if mimeError != nil {
		errors = append(errors, mimeError)
	}
	metadata.Type = trackType
	if illustrationPath := illustration.GetIllustrationFilePath(filePath); len(illustrationPath) > 0 {
		metadata.IllustrationPath = illustrationPath
		metadata.IllustrationLocation = internal.Inline
	}
	return metadata, errors
}

func getMetadataFromMatches(matches []string, regex *regexp.Regexp) (internal.Metadata, []error) {
	var metadata internal.Metadata
	var errors []error

	metadata.Index = -1
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
	if index := regex.SubexpIndex("Label"); index != -1 {
		metadata.Label = matches[index]
	}
	if index := regex.SubexpIndex("Year"); index != -1 && len(matches[index]) > 0 {
		date, err := time.Parse("2006", matches[index])
		if err == nil {
			metadata.ReleaseDate = &date
		} else {
			errors = append(errors, fmt.Errorf("invalid year: '%s'", matches[index]))
		}
	}
	if index := regex.SubexpIndex("DiscName"); index != -1 {
		metadata.DiscName = matches[index]
	}
	if index := regex.SubexpIndex("Disc"); index != -1 && len(matches[index]) > 0 {
		value, err := strconv.Atoi(matches[index])
		if err == nil {
			metadata.DiscIndex = int64(value)
		} else {
			errors = append(errors, fmt.Errorf("invalid disc index: '%s'", matches[index]))
		}
	}
	if index := regex.SubexpIndex("Index"); index != -1 && len(matches[index]) > 0 {
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
	if index := regex.SubexpIndex("BPM"); index != -1 {
		bpm, err := strconv.ParseFloat(matches[index], 64)
		if err == nil {
			metadata.Bpm = bpm
		}
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
