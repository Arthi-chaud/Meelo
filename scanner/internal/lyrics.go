package internal

import (
	"fmt"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

type Lyrics interface {
	isLyrics()
}

type PlainLyrics []string

func (_ PlainLyrics) isLyrics() {}

type SyncedLyrics []SyncedLyric
type SyncedLyric struct {
	// In seconds
	Timestamp float64 `json:"timestamp"`
	Content   string  `json:"content"`
}

func (_ SyncedLyrics) isLyrics() {}

func (l *PlainLyrics) Sanitize() {
	for i, entry := range *l {
		(*l)[i] = strings.TrimSuffix(entry, "\r")
	}
}

func (l SyncedLyrics) ToPlain() PlainLyrics {
	var res PlainLyrics = make([]string, len(l))
	for i, entry := range l {
		res[i] = entry.Content
	}
	res.Sanitize()
	return res
}

func ParseLyrics(s string) Lyrics {
	syncedLyrics := SyncedLyrics{}
	offset := float64(0) // offset in seconds
	failed := false
	lines := strings.Split(s, "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if len(line) == 0 {
			continue
		}

		// Parsing offset tag
		if m := offsetRegex.FindStringSubmatch(line); len(m) != 0 {
			parsedOffset, err := strconv.ParseInt(m[1], 10, 64)
			if err == nil {
				offset = float64(parsedOffset) / 1000
				continue
			}
			failed = true
			break
		}

		// Ugly check that it's a timestamp and not anyother tag
		times, lyric, err := parseTimestampAndLyric(line)

		// Check if it's any other tag
		if err != nil {
			if m := tagRegex.FindStringSubmatch(line); len(m) == 0 {
				failed = true
				break
			}
			continue
		}
		for _, time := range times {
			syncedLyrics = append(syncedLyrics, SyncedLyric{time, strings.TrimSpace(lyric)})
		}
	}
	if failed {
		return PlainLyrics(lines)
	}

	if offset != 0 {
		for i, _ := range syncedLyrics {
			// a possitive offset makes the lyric come up sooner
			syncedLyrics[i].Timestamp -= offset
		}
	}
	sort.Slice(syncedLyrics, func(a, b int) bool {
		return syncedLyrics[a].Timestamp <= syncedLyrics[b].Timestamp
	})
	return syncedLyrics
}

func parseTimestampAndLyric(line string) ([]float64, string, error) {
	time := float64(0)
	res := timestampRegex.FindStringSubmatch(line)
	if len(res) != 5 {
		return nil, "", fmt.Errorf("regex didn't match")
	}
	// Convert time into float
	for i, timeStr := range res[1:4] {
		parsedTime, err := strconv.ParseInt(timeStr, 10, 64)
		if err != nil {
			return nil, "", err
		}
		if i == 2 {
			time += float64(parsedTime) / 100
		} else {
			time += float64(parsedTime) * math.Pow(60, float64(1-i))
		}
	}
	lyric := res[4]
	// check if recursive
	otherTimes, nestedlyric, err := parseTimestampAndLyric(lyric)
	if err != nil {
		return []float64{time}, lyric, nil
	}
	return append(otherTimes, time), nestedlyric, nil
}

var (
	timestampRegex = regexp.MustCompile(`^\[(?P<Min>\d{2}):(?P<Sec>\d{2}).(?P<Mil>\d{2})\](?P<Rest>.*)$`)
	tagRegex       = regexp.MustCompile(`\[([^\]]+):([^\]]+)\]`)
	offsetRegex    = regexp.MustCompile(`\[offset:(?P<offset>[+-]\d+)\]`)
)
