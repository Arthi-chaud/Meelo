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
	assert.Equal(t, internal.Audio, m.Type)
	assert.Equal(t, int64(136), m.Bitrate)
	assert.Equal(t, int64(210), m.Duration)
	assert.Equal(t, "", m.Release)
	assert.Equal(t, time.Date(2007, 1, 1, 1, 1, 1, 1, time.UTC).Year(), m.ReleaseDate.Year())
	assert.Equal(t, int64(2), m.DiscIndex)
	assert.Equal(t, int64(3), m.Index)
	assert.Equal(t, []string{"Pop", "Rock", "Trip-Hop"}, m.Genres)
	assert.Equal(t, []string{"A", "B", "C", "", "D", "", "", "E", ""}, m.Lyrics)
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
	assert.Equal(t, internal.Audio, m.Type)
	assert.Equal(t, int64(217), m.Duration)
	assert.Equal(t, "", m.Release)
	assert.Equal(t, time.Date(1999, 1, 1, 1, 1, 1, 1, time.UTC).Year(), m.ReleaseDate.Year())
	assert.Equal(t, int64(2), m.DiscIndex)
	assert.Equal(t, int64(1), m.Index)
	assert.Empty(t, m.Genres)
	assert.Equal(t, "Title", m.Name)
}
