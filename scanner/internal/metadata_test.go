package internal

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestVMergeMetadataCorrectOverride(t *testing.T) {
	m1 := Metadata{
		Artist:           "A",
		AlbumArtist:      "",
		AlbumReleaseDate: nil,
	}
	m2Date := time.Date(2007, 1, 1, 1, 1, 1, 1, time.UTC)
	m2 := Metadata{
		Artist:           "B",
		AlbumArtist:      "B",
		AlbumReleaseDate: &m2Date,
	}
	m3, _ := Merge(m1, m2)

	assert.Equal(t, "A", m3.Artist)
	assert.Equal(t, "B", m3.AlbumArtist)
	assert.Equal(t, 2007, m3.AlbumReleaseDate.Year())
}
