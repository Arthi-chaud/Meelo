package parser

import (
	"path"
	"strings"
	"time"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	c "github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/kpango/glg"
)

func ParseMetadata(config c.UserSettings, filePath string) (internal.Metadata, []error) {
	var metadata internal.Metadata
	var errors []error
	if config.Metadata.Order == c.Only {
		if config.Metadata.Source == c.Path {
			metadata, errors = parseMetadataFromPath(config, filePath)
		} else {
			metadata, errors = parseMetadataFromEmbeddedTags(filePath)
		}
	} else {
		embeddedMetadata, embeddedErrors := parseMetadataFromEmbeddedTags(filePath)
		pathMetadata, pathErrors := parseMetadataFromPath(config, filePath)
		errors = append(pathErrors, embeddedErrors...)
		if config.Metadata.Source == c.Path {
			metadata = internal.Merge(pathMetadata, embeddedMetadata)
		} else {
			metadata = internal.Merge(embeddedMetadata, pathMetadata)
		}
	}
	compilationArtistNames := internal.Fmap(
		append(config.Compilations.Artists, internal.CompilationKeyword),
		func(a string, _ int) string {
			return strings.ToLower(a)
		})
	metadata.IsCompilation = internal.Contains(compilationArtistNames, strings.ToLower(metadata.AlbumArtist)) ||
		internal.Contains(compilationArtistNames, strings.ToLower(metadata.Artist))
	metadata.Path = filePath
	metadata.RegistrationDate = time.Now()
	checksum, err := internal.ComputeChecksum(filePath)
	if err != nil {
		errors = append(errors, err)
	}
	metadata.Checksum = checksum
	// Let's save some time by skipping acoustid for unreasonably long media
	if metadata.Type == internal.Audio || metadata.Duration < 1200 { // 20 minutes
		fingerprint, err := internal.GetFileAcousticFingerprint(filePath)
		if err != nil {
			glg.Failf("failed to compute Fingerprint for '%s'", path.Base(filePath))
			glg.Fail(err.Error())
		} else {
			metadata.Fingerprint = &fingerprint
		}
	}
	return metadata, append(errors, internal.SanitizeAndValidateMetadata(&metadata)...)
}
