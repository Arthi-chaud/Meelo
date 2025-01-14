package parser

import (
	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/stretchr/testify/assert"
	p "path"
	"testing"
	"time"
)

func TestEmbedded(t *testing.T) {
	path := p.Join("../..", "testdata", "dreams.m4a")
	m, err := parseMetadataFromEmbeddedTags(path)

	assert.Len(t, err, 0)
	assert.Equal(t, "My Album Artist", m.AlbumArtist)
	assert.Equal(t, "My Artist", m.Artist)
	assert.Equal(t, false, m.IsCompilation)
	assert.Equal(t, "My Album", m.Album)
	assert.Equal(t, internal.Audio, m.Type)
	assert.Equal(t, int64(134), m.Bitrate)
	assert.Equal(t, int64(210), m.Duration)
	assert.Equal(t, "", m.Release)
	assert.Equal(t, time.Date(2007, 1, 1, 1, 1, 1, 1, time.UTC).Year(), m.ReleaseDate.Year())
	assert.Equal(t, int64(2), m.DiscIndex)
	assert.Equal(t, int64(3), m.Index)
	assert.Equal(t, []string{"Pop"}, m.Genres)
	assert.Equal(t, "Dreams", m.Name)
}
