package parser

import (
	"context"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/illustration"
	"gopkg.in/vansante/go-ffprobe.v2"
)

func GetValue(t ffprobe.Tags, tag string) (string, error) {
	res, err := t.GetString(tag)
	if len(res) > 0 && err == nil {
		return res, err
	}
	return t.GetString(strings.ToUpper(tag))
}

type parseTagFn func(string)

// Tries to get each tag by key one after the other. If it success, calls function and returns
func ParseTag(t ffprobe.Tags, keys []string, fun parseTagFn) {
	for _, key := range keys {
		value, err := GetValue(t, key)
		if err == nil && len(value) > 0 {
			fun(value)
			return
		}
	}
}

// sources for keys:
// https://github.com/Arthi-chaud/Meelo/issues/851
// https://github.com/FFmpeg/FFmpeg/blob/c5287178b4dc373e763f7cd49703a6e3192aab3a/libavformat/id3v2.c#L105
// https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-frames.html

func parseMetadataFromEmbeddedTags(filePath string) (internal.Metadata, []error) {
	ctx, cancelFn := context.WithCancel(context.Background())
	defer cancelFn()
	var errors []error

	probeData, err := ffprobe.ProbeURL(ctx, filePath)
	if err != nil {
		return internal.Metadata{}, []error{err}
	}
	var metadata internal.Metadata
	if bitrate, err := strconv.Atoi(probeData.Format.BitRate); err == nil {
		metadata.Bitrate = int64(math.Floor(float64(bitrate) / float64(1000)))
	} else {
		errors = append(errors, fmt.Errorf("could not parse bitrate. %s", err.Error()))
	}
	metadata.Duration = int64(probeData.Format.DurationSeconds)
	metadata.Type = getType(*probeData)

	tags := probeData.Format.TagList
	ParseTag(tags, []string{"artist", "tope"}, func(value string) {
		metadata.Artist = value
	})
	ParseTag(tags, []string{"album"}, func(value string) {
		metadata.Album = value
	})
	ParseTag(tags, []string{"album_artist", "albumartist"}, func(value string) {
		metadata.AlbumArtist = value
	})
	ParseTag(tags, []string{"title"}, func(value string) {
		metadata.Name = value
	})
	ParseTag(tags, []string{"genre", "tcon"}, func(value string) {
		metadata.Genres = []string{value}
	})
	ParseTag(tags, []string{"track", "trck"}, func(value string) {
		rawTrackValue, _, _ := strings.Cut(value, "/")
		trackValue, _ := strconv.Atoi(rawTrackValue)
		metadata.Index = int64(trackValue)
	})
	ParseTag(tags, []string{"lyrics", "uslt"}, func(value string) {
		metadata.Lyrics = strings.Split(
			strings.ReplaceAll(
				strings.ReplaceAll(value, "\r", "\n"),
				"\r\n",
				"\n",
			),
			"\n",
		)
	})
	ParseTag(tags, []string{"disc", "tpos"}, func(value string) {
		rawDiscValue, _, _ := strings.Cut(value, "/")
		discValue, _ := strconv.Atoi(rawDiscValue)
		metadata.DiscIndex = int64(discValue)
	})

	ParseTag(tags, []string{"date", "tory", "tyer"}, func(value string) {
		// iTunes purchases use an ISO format
		for _, format := range []string{"2006", time.DateOnly, time.DateTime, time.RFC3339} {
			date, err := time.Parse(format, value)
			if err == nil {
				metadata.ReleaseDate = &date
			}
		}
	})
	if metadata.ReleaseDate == nil {
		ParseTag(tags, []string{"year"}, func(value string) {
			// MP3s only store year(?)
			date, err := time.Parse("2006", value)
			if err == nil {
				metadata.ReleaseDate = &date
			}
		})
	}
	if streamIndex := illustration.GetEmbeddedIllustrationStreamIndex(*probeData); streamIndex >= 0 {
		metadata.IllustrationLocation = internal.Embedded
		metadata.IllustrationStreamIndex = streamIndex
	}
	return metadata, errors
}

func getType(probeData ffprobe.ProbeData) internal.TrackType {
	videoStream := probeData.FirstVideoStream()
	if videoStream == nil || videoStream.Disposition.AttachedPic == 1 || videoStream.Duration == "" {
		return internal.Audio
	}
	return internal.Video
}
