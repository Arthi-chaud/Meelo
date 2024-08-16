package internal

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestVMergeMetadataCorrectOverride(t *testing.T) {
	m1 := Metadata{
		Artist:      "A",
		AlbumArtist: "",
	}
	m2 := Metadata{
		Artist:      "B",
		AlbumArtist: "B",
	}
	m3 := Merge(m1, m2)

	assert.Equal(t, "A", m3.Artist)
	assert.Equal(t, "B", m3.AlbumArtist)
}
