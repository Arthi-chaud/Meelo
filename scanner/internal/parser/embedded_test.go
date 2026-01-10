package parser

import (
	p "path"
	"testing"
	"time"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/stretchr/testify/assert"
)

func getTestConfig() config.UserSettings {
	return config.UserSettings{
		Compilations: config.CompilationSettings{
			UseID3CompTag: true,
		},
	}
}

func TestEmbedded(t *testing.T) {
	path := p.Join("../..", "testdata", "dreams.m4a")
	m, err := parseMetadataFromEmbeddedTags(path, getTestConfig())

	assert.Len(t, err, 0)
	assert.Equal(t, "My Album Artist", m.AlbumArtist)
	assert.Equal(t, "My Artist", m.Artist)
	assert.Equal(t, true, m.IsCompilation)
	assert.Equal(t, "My Album", m.Album)
	assert.Equal(t, int64(136), m.Bitrate)
	assert.Equal(t, int64(210), m.Duration)
	assert.Equal(t, "", m.Release)
	assert.Equal(t, 2007, m.ReleaseReleaseDate.Year())
	assert.Nil(t, m.AlbumReleaseDate)
	assert.Equal(t, int64(2), m.DiscIndex)
	assert.Equal(t, int64(3), m.Index)
	assert.Equal(t, []string{"Pop", "Rock", "Trip-Hop"}, m.Genres)
	assert.Equal(t, internal.PlainLyrics{"A", "B", "C", "", "D", "", "", "E", ""}, m.PlainLyrics)
	assert.Equal(t, "Dreams", m.Name)
}

func TestEmbeddedFlac(t *testing.T) {
	path := p.Join("../..", "testdata", "test.flac")
	m, err := parseMetadataFromEmbeddedTags(path, getTestConfig())

	assert.Len(t, err, 0)
	assert.Equal(t, "Album Artist", m.AlbumArtist)
	assert.Equal(t, "Artist", m.Artist)
	assert.Equal(t, false, m.IsCompilation)
	assert.Equal(t, "Album", m.Album)
	assert.Equal(t, "My Disc", m.DiscName)
	assert.Equal(t, int64(217), m.Duration)
	assert.Equal(t, "", m.Release)
	assert.Equal(t, 1999, m.ReleaseReleaseDate.Year())
	assert.Equal(t, time.Month(1), m.ReleaseReleaseDate.Month())
	assert.Equal(t, 1, m.ReleaseReleaseDate.Day())

	assert.Equal(t, 1999, m.AlbumReleaseDate.Year())
	assert.Equal(t, time.Month(12), m.AlbumReleaseDate.Month())
	assert.Equal(t, 30, m.AlbumReleaseDate.Day())
	assert.Equal(t, int64(2), m.DiscIndex)
	assert.Equal(t, int64(1), m.Index)
	assert.Empty(t, m.Genres)
	assert.Equal(t, "Title", m.Name)
}

func TestEmbeddedOpus(t *testing.T) {
	path := p.Join("../..", "testdata", "test.opus")
	m, err := parseMetadataFromEmbeddedTags(path, getTestConfig())

	assert.Len(t, err, 0)
	assert.Equal(t, "Album Artist", m.AlbumArtist)
	assert.Equal(t, "Artist", m.Artist)
	assert.Equal(t, false, m.IsCompilation)
	assert.Equal(t, "Album", m.Album)
	assert.Equal(t, int64(217), m.Duration)
	assert.Equal(t, "", m.Release)
	assert.Equal(t, 1999, m.ReleaseReleaseDate.Year())
	assert.Nil(t, m.AlbumReleaseDate)
	assert.Equal(t, int64(2), m.DiscIndex)
	assert.Equal(t, int64(1), m.Index)
	assert.Empty(t, m.Genres)
	assert.Equal(t, "Title", m.Name)
}
