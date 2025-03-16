package parser

import (
	"path"
	"strings"
	"time"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	c "github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/rs/zerolog/log"
)

func ParseMetadata(config c.UserSettings, filePath string) (internal.Metadata, []error) {
	var metadata internal.Metadata
	var errors []error
	if config.Metadata.Order == c.Only {
		if config.Metadata.Source == c.Path {
			metadata, errors = parseMetadataFromPath(config, filePath)
		} else {
			metadata, errors = parseMetadataFromEmbeddedTags(filePath, config)
		}
	} else {
		embeddedMetadata, embeddedErrors := parseMetadataFromEmbeddedTags(filePath, config)
		pathMetadata, pathErrors := parseMetadataFromPath(config, filePath)
		errors = append(pathErrors, embeddedErrors...)
		var err error
		if config.Metadata.Source == c.Path {
			metadata, err = internal.Merge(pathMetadata, embeddedMetadata)
		} else {
			metadata, err = internal.Merge(embeddedMetadata, pathMetadata)
		}
		if err != nil {
			errors = append(errors, err)
		}
	}
	compilationArtistNames := internal.Fmap(
		append(config.Compilations.Artists, internal.CompilationKeyword),
		func(a string, _ int) string {
			return strings.ToLower(a)
		})
	metadata.IsCompilation = metadata.IsCompilation ||
		internal.Contains(compilationArtistNames, strings.ToLower(metadata.AlbumArtist)) ||
		internal.Contains(compilationArtistNames, strings.ToLower(metadata.Artist))
	metadata.Path = filePath
	metadata.RegistrationDate = time.Now()
	checksum, err := internal.ComputeChecksum(filePath)
	if err != nil {
		errors = append(errors, err)
	}
	metadata.Checksum = checksum
	//TODO Look for LRC file
	// Let's save some time by skipping acoustid for unreasonably long media
	if metadata.Type == internal.Audio || metadata.Duration < 1200 { // 20 minutes
		fingerprint, err := internal.GetFileAcousticFingerprint(filePath)
		if err != nil {
			// Fingerprinting failure is not fatal
			log.Error().Str("file", path.Base(filePath)).Msg("failed to compute fingerprint")
			log.Trace().Msg(err.Error())
		} else {
			metadata.Fingerprint = &fingerprint
		}
	}
	return metadata, append(errors, internal.SanitizeAndValidateMetadata(&metadata)...)
}
