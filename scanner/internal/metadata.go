package internal

import (
	e "errors"
	"fmt"
	"time"

	"dario.cat/mergo"
	"github.com/go-playground/validator/v10"
	"github.com/kpango/glg"
)

type Metadata struct {
	// True if the track is from a compilation album
	IsCompilation bool
	// Name of the artist of the track
	Artist string `validate:"required"`
	// Name of the artist of the parent album
	AlbumArtist string
	// Name of the album of the track
	Album string `validate:"required"`
	// Name of the release of the track
	Release string `validate:"required"`
	// Name of the track
	Name string `validate:"required"`
	// Release date of the track
	ReleaseDate time.Time
	// Index of the track on the disc
	Index int64
	// Index of the disc the track is on
	DiscIndex int64
	// Bitrate of the file, in kbps
	Bitrate int64 `validate:"gte=0"`
	// Duration, in seconds
	Duration int64 `validate:"gte=0"`
	// Type of the track
	Type TrackType `validate:"required"`
	// Genres of the track
	Genres []string
	// Discogs ID of the parent release
	DiscogsId         string
	IllustrationBytes []byte
	RegistrationDate  time.Time `validate:"required"`
	Checksum          string    `validate:"required"`
	Path              string    `validate:"required"`
}

type TrackType string

const (
	Audio TrackType = "Audio"
	Video TrackType = "Video"
)

type IllustrationLocation string

const (
	Embedded IllustrationLocation = "Embedded"
	Inline   IllustrationLocation = "Inline"
)

func SanitizeAndValidateMetadata(m *Metadata) []error {
	// Sanitize
	if len(m.Album) == 0 {
		m.Album = m.Release
	}
	if len(m.Release) == 0 {
		m.Release = m.Album
	}
	if m.IsCompilation {
		m.AlbumArtist = ""
	} else if len(m.AlbumArtist) == 0 {
		m.AlbumArtist = m.Artist
	}
	if len(m.Artist) == 0 {
		m.Artist = m.AlbumArtist
	}
	// Validation
	validationsErrs := validator.New(validator.WithRequiredStructEnabled()).Struct(m)
	errors := PrettifyValidationError(validationsErrs, "metadata")

	if len(m.DiscogsId) > 0 && !IsNumeric(m.DiscogsId) {
		errors = append(errors, fmt.Errorf("metadata: discogs id is expected to be a numeric string. got '%s'", m.DiscogsId))
	}
	if !m.IsCompilation && len(m.AlbumArtist) == 0 && len(m.Artist) == 0 {
		errors = append(errors, e.New("missing fields 'album artist' and 'artist"))
	}
	return errors
}

// Will override m1's values m2's if m1's is empty
func Merge(m1 Metadata, m2 Metadata) Metadata {
	if err := mergo.Merge(&m1, m2, mergo.WithOverrideEmptySlice); err != nil {
		glg.Warn("merging Metadata structs may have failed")
		glg.Warn(err.Error())
		glg.Warnf("destination: %+v", m1)
		glg.Warnf("source: %+v", m2)
	}
	// dates do not seem to be overwritten correctly
	if m1.ReleaseDate.Year() == 1 {
		m1.ReleaseDate = m2.ReleaseDate
	}
	return m1
}
