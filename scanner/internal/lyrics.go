package internal

import (
	"sort"
	"strings"

	"github.com/alecthomas/participle"
)

type Lyrics interface {
	isLyrics()
}

type PlainLyrics []string

func (_ PlainLyrics) isLyrics() {}

type SyncedLyrics []SyncedLyric
type SyncedLyric struct {
	Timestamp float64 `json:"timestamp"`
	Content   string  `json:"content"`
}

func (_ SyncedLyrics) isLyrics() {}

func ParseLyrics(s string) Lyrics {
	lines := strings.Split(s, "\n")
	syncedLyrics := SyncedLyrics{}
	parser, err := participle.Build[LRCLine]()
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if len(line) == 0 {
			continue
		}

	}
	sort.Slice(syncedLyrics, func(a, b int) bool {
		return syncedLyrics[a].Timestamp <= syncedLyrics[b].Timestamp
	})
	// If error
	return PlainLyrics(lines)
}

type LRCLine struct {
	Tag   *LRCTag   `  @@`
	Lyric *LRCLyric `| @@`
}

type LRCLyric struct {
	Timestamp string `"[" @Ident "]"`
	Content   string `@String`
}

type LRCTimestamp struct {
	Minutes      int `@Int ":"`
	Seconds      int `@Int "."`
	Centiseconds int `@Int`
}

type LRCTag struct {
}
