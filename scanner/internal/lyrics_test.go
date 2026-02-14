package internal

import (
	"os"
	"path"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLyricsParsing(t *testing.T) {

	path := path.Join("..", "testdata", "lyrics.lrc")
	lyric, _ := os.ReadFile(path)
	res := ParseLyrics(string(lyric))
	switch lyrics := res.(type) {
	case PlainLyrics:
		assert.Fail(t, "Returned Plainlyrics instead of SyncedLyrics")
	case SyncedLyrics:
		assert.Equal(t, 5, len(lyrics))
		expected := []SyncedLyric{
			{Timestamp: 2, Content: "Line 1 lyrics"},
			{Timestamp: 3.20, Content: "Line 2 lyrics"},
			{Timestamp: 46.10, Content: "Repeating lyrics"},
			{Timestamp: 64.10, Content: "Repeating lyrics"},
			{Timestamp: 65.00, Content: "Last lyrics line"},
		}
		// For easier log/debug
		for i, expectedEntry := range expected {
			assert.Equal(t, expectedEntry, lyrics[i])
		}
		return
	}
}
