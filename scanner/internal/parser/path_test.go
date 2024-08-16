package parser

import (
	"testing"
	"time"
	// "time"

	// "github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/stretchr/testify/assert"
)

// settingsName is the file name without extension
func getTestConfig() config.UserSettings {
	return config.UserSettings{
		TrackRegex: []string{
			"^([\\/\\\\]+.*)*[\\/\\\\]+(?P<AlbumArtist>.+)[\\/\\\\]+(?P<Album>.+)(\\s+\\((?P<Year>\\d{4})\\))[\\/\\\\]+((?P<Disc>[0-9]+)-)?(?P<Index>[0-9]+)\\s+(?P<Track>.*)\\s+\\((?P<Artist>.*)\\)\\..*$",
			"^([\\/\\\\]+.*)*[\\/\\\\]+(?P<AlbumArtist>.+)[\\/\\\\]+(?P<Album>.+)(\\s+\\((?P<Year>\\d{4})\\))[\\/\\\\]+((?P<Disc>[0-9]+)-)?(?P<Index>[0-9]+)\\s+(?P<Track>.*)\\..*$",
		},
	}
}

func TestPathNoMatch(t *testing.T) {
	path := "trololol"
	_, err := ParseMetadataFromPath(getTestConfig(), path)

	assert.Len(t, err, 1)
	assert.Contains(t, err[0].Error(), "file did not match any regexes")
}

func TestPathSimple(t *testing.T) {
	path := "/data/My Album Artist/My Album (2006)/1-02 My Track (My Artist).m4a"
	m, err := ParseMetadataFromPath(getTestConfig(), path)

	assert.Len(t, err, 0)
	assert.Equal(t, "My Album Artist", m.AlbumArtist)
	assert.Equal(t, "My Artist", m.Artist)
	assert.Equal(t, false, m.IsCompilation)
	assert.Equal(t, "My Album", m.Album)
	assert.Equal(t, internal.Audio, m.Type)
	assert.Equal(t, int64(0), m.Bitrate)
	assert.Equal(t, int64(0), m.Duration)
	assert.Equal(t, "", m.Release)
	assert.Equal(t, time.Date(2006, 1, 1, 1, 1, 1, 1, time.UTC).Year(), m.ReleaseDate.Year())
	assert.Equal(t, int64(1), m.DiscIndex)
	assert.Equal(t, int64(2), m.Index)
	assert.Empty(t, m.Genres)
	assert.Equal(t, "My Track", m.Name)
}

func TestPathCompilation(t *testing.T) {
	path := "/data/Compilations/My Album (2006)/1-02 My Track.m4v"
	m, err := ParseMetadataFromPath(getTestConfig(), path)

	assert.Len(t, err, 0)
	assert.Equal(t, "", m.AlbumArtist)
	assert.Equal(t, "", m.Artist)
	assert.Equal(t, true, m.IsCompilation)
	assert.Equal(t, "My Album", m.Album)
	assert.Equal(t, internal.Video, m.Type)
	assert.Equal(t, int64(0), m.Bitrate)
	assert.Equal(t, int64(0), m.Duration)
	assert.Equal(t, "", m.Release)
	assert.Equal(t, time.Date(2006, 1, 1, 1, 1, 1, 1, time.UTC).Year(), m.ReleaseDate.Year())
	assert.Equal(t, int64(1), m.DiscIndex)
	assert.Equal(t, int64(2), m.Index)
	assert.Empty(t, m.Genres)
	assert.Equal(t, "My Track", m.Name)
}
