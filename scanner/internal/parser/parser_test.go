package parser

import (
	"path"
	"testing"
	"time"

	// "time"

	// "github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/stretchr/testify/assert"
)

// settingsName is the file name without extension
func getParserTestConfig() config.UserSettings {
	return config.UserSettings{
		Metadata: config.MetadataSettings{
			Source: config.Path,
			Order:  config.Only,
		},
		TrackRegex: []string{
			"^([\\/\\\\]+.*)*[\\/\\\\]+(?P<AlbumArtist>.+)[\\/\\\\]+(?P<Album>.+)(\\s+\\((?P<Year>\\d{4})\\))[\\/\\\\]+((?P<Disc>[0-9]+)-)?(?P<Index>[0-9]+)\\s+(?P<Track>.*)\\s+\\((?P<Artist>.*)\\)\\..*$",
			"^([\\/\\\\]+.*)*[\\/\\\\]+(?P<AlbumArtist>.+)[\\/\\\\]+(?P<Album>.+)(\\s+\\((?P<Year>\\d{4})\\))[\\/\\\\]+((?P<Disc>[0-9]+)-)?(?P<Index>[0-9]+)\\s+(?P<Track>.*)\\..*$",
			"^([\\/\\\\]+.*)*[\\/\\\\]+(?P<AlbumArtist>.+)[\\/\\\\]+Unknown Album[\\/\\\\]+(?P<Track>.*)\\..*$",
		},
	}
}

func TestParser(t *testing.T) {
	path := "/data/My Album Artist/My Album (2006)/1-02 My Track (My Artist).m4a"
	m, err := ParseMetadata(getParserTestConfig(), path)

	assert.Len(t, err, 2) // stat failure and no checksum
	assert.Equal(t, "My Album Artist", m.AlbumArtist)
	assert.Equal(t, "My Artist", m.Artist)
	assert.Equal(t, false, m.IsCompilation)
	assert.Equal(t, "My Album", m.Album)
	assert.Equal(t, internal.Audio, m.Type)
	assert.Equal(t, int64(0), m.Bitrate)
	assert.Equal(t, int64(0), m.Duration)
	assert.Equal(t, "My Album", m.Release)
	assert.Equal(t, time.Date(2006, 1, 1, 1, 1, 1, 1, time.UTC).Year(), m.ReleaseDate.Year())
	assert.Equal(t, int64(1), m.DiscIndex)
	assert.Equal(t, int64(2), m.Index)
	assert.Empty(t, m.Genres)
	assert.Equal(t, "My Track", m.Name)
}

func TestParserCompilation(t *testing.T) {
	path := "/data/Compilations/My Album (2006)/1-02 My Track.m4v"
	m, err := ParseMetadata(getParserTestConfig(), path)

	assert.Len(t, err, 3) // stat failure, missing artist and no checksum
	assert.Contains(t, err[1].Error(), "Metadata.Artist")
	assert.Equal(t, "", m.AlbumArtist)
	assert.Equal(t, "", m.Artist)
	assert.Equal(t, true, m.IsCompilation)
	assert.Equal(t, "My Album", m.Album)
	assert.Equal(t, internal.Video, m.Type)
	assert.Equal(t, int64(0), m.Bitrate)
	assert.Equal(t, int64(0), m.Duration)
	assert.Equal(t, "My Album", m.Release)
	assert.Equal(t, time.Date(2006, 1, 1, 1, 1, 1, 1, time.UTC).Year(), m.ReleaseDate.Year())
	assert.Equal(t, int64(1), m.DiscIndex)
	assert.Equal(t, int64(2), m.Index)
	assert.Empty(t, m.Genres)
	assert.Equal(t, "My Track", m.Name)
}

func TestParserEmbedded(t *testing.T) {
	path := path.Join("../..", "testdata", "dreams.m4a")
	c := getParserTestConfig()
	c.TrackRegex = []string{"^.*$"}
	c.Metadata.Order = config.Preferred
	c.Metadata.Source = config.Path
	m, err := ParseMetadata(c, path)

	assert.Len(t, err, 0)
	assert.Equal(t, "My Album Artist", m.AlbumArtist)
	assert.Equal(t, "My Artist", m.Artist)
	assert.Equal(t, false, m.IsCompilation)
	assert.Equal(t, "My Album", m.Album)
	assert.Equal(t, internal.Audio, m.Type)
	assert.Equal(t, int64(136), m.Bitrate)
	assert.Equal(t, int64(210), m.Duration)
	assert.Equal(t, "My Album", m.Release)
	assert.Equal(t, time.Date(2007, 1, 1, 1, 1, 1, 1, time.UTC).Year(), m.ReleaseDate.Year())
	assert.Equal(t, int64(2), m.DiscIndex)
	assert.Equal(t, int64(3), m.Index)
	assert.Equal(t, []string{"Pop", "Rock", "Trip-Hop"}, m.Genres)
	assert.Equal(t, "Dreams", m.Name)
	assert.Equal(t, internal.Inline, m.IllustrationLocation)
	assert.Equal(t, "../../testdata/cover.jpg", m.IllustrationPath)
}

func TestParserEmbeddedIsCompilation(t *testing.T) {
	path := path.Join("../..", "testdata", "dreams.m4a")
	c := getParserTestConfig()
	c.TrackRegex = []string{"^.*$"}
	c.Metadata.Order = config.Preferred
	c.Metadata.Source = config.Path
	c.Compilations.UseID3CompTag = true
	m, err := ParseMetadata(c, path)

	assert.Len(t, err, 0)
	assert.Equal(t, "", m.AlbumArtist)
	assert.Equal(t, "My Artist", m.Artist)
	assert.Equal(t, true, m.IsCompilation)
	assert.Equal(t, "My Album", m.Album)
	assert.Equal(t, internal.Audio, m.Type)
	assert.Equal(t, int64(136), m.Bitrate)
	assert.Equal(t, int64(210), m.Duration)
	assert.Equal(t, "My Album", m.Release)
	assert.Equal(t, time.Date(2007, 1, 1, 1, 1, 1, 1, time.UTC).Year(), m.ReleaseDate.Year())
	assert.Equal(t, int64(2), m.DiscIndex)
	assert.Equal(t, int64(3), m.Index)
	assert.Equal(t, []string{"Pop", "Rock", "Trip-Hop"}, m.Genres)
	assert.Equal(t, "Dreams", m.Name)
	assert.Equal(t, internal.Inline, m.IllustrationLocation)
	assert.Equal(t, "../../testdata/cover.jpg", m.IllustrationPath)
}

func TestParserStandaloneTrack(t *testing.T) {
	path := "/data/Lady Gaga/Unknown Album/Bad Romance.m4v"
	m, err := ParseMetadata(getParserTestConfig(), path)

	assert.Len(t, err, 2) // fpcalc error and no checksum
	assert.Equal(t, "Lady Gaga", m.AlbumArtist)
	assert.Equal(t, "Lady Gaga", m.Artist)
	assert.Equal(t, false, m.IsCompilation)
	assert.Equal(t, "", m.Album)
	assert.Equal(t, internal.Video, m.Type)
	assert.Equal(t, int64(0), m.Bitrate)
	assert.Equal(t, int64(0), m.Duration)
	assert.Equal(t, "", m.Release)
	assert.Equal(t, int64(0), m.DiscIndex)
	assert.Equal(t, int64(0), m.Index)
	assert.Empty(t, m.Genres)
	assert.Equal(t, "Bad Romance", m.Name)
}

func TestParserFileType(t *testing.T) {
	path := path.Join("../..", "testdata", "video.mkv")
	c := getParserTestConfig()
	c.TrackRegex = []string{"^.*$"}
	c.Metadata.Source = config.Embedded
	c.Metadata.Order = config.Preferred
	m, _ := ParseMetadata(c, path)

	assert.Equal(t, internal.Video, m.Type)
}
