package parser

import (
	"context"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/illustration"
	"gopkg.in/vansante/go-ffprobe.v2"
)

type parseTagFn func(string)

// Tries to get each tag by key one after the other. If it success, calls function and returns
func ParseTag(t ffprobe.Tags, keys []string, fun parseTagFn) {
	for _, key := range keys {
		value, found := t[key]
		if !found {
			continue
		}
		var s string = value.(string)
		if len(s) > 0 {
			fun(s)
			return
		}
	}
}

func CollectTags(probeData *ffprobe.ProbeData) ffprobe.Tags {
	var tags ffprobe.Tags = make(ffprobe.Tags)
	// In some format (e.g. opus)
	// Tags are attached to the audio stream,
	// Not the 'Format'
	for _, s := range probeData.Streams {
		for k, v := range s.TagList {
			tags[strings.ToLower(k)] = v
		}
	}
	for k, v := range probeData.Format.TagList {
		tags[strings.ToLower(k)] = v
	}
	return tags
}

// sources for keys:
// https://github.com/Arthi-chaud/Meelo/issues/851
// https://github.com/FFmpeg/FFmpeg/blob/c5287178b4dc373e763f7cd49703a6e3192aab3a/libavformat/id3v2.c#L105
// https://mutagen-specs.readthedocs.io/en/latest/id3/id3v2.4.0-frames.html

func parseMetadataFromEmbeddedTags(filePath string, c config.UserSettings) (internal.Metadata, []error) {
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
	tags := CollectTags(probeData)

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
	ParseTag(tags, []string{"discsubtitle"}, func(value string) {
		metadata.DiscName = value
	})
	ParseTag(tags, []string{"genres", "genre", "tcon"}, func(value string) {
		metadata.Genres = strings.FieldsFunc(value, func(r rune) bool {
			return r == ';' || r == '\\' || r == ','
		})
	})
	if c.Compilations.UseID3CompTag {
		ParseTag(tags, []string{"compilation", "compilations", "itunescompilation"}, func(value string) {
			isCompilation, err := strconv.ParseBool(value)
			if err != nil {
				flag, err := strconv.ParseInt(value, 10, 64)
				if err == nil {
					metadata.IsCompilation = flag == 1
				}
			} else {
				metadata.IsCompilation = isCompilation
			}
		})
	}
	ParseTag(tags, []string{"track", "trck"}, func(value string) {
		rawTrackValue, _, _ := strings.Cut(value, "/")
		trackValue, _ := strconv.Atoi(rawTrackValue)
		metadata.Index = int64(trackValue)
	})
	ParseTag(tags, []string{"lyrics", "uslt"}, func(value string) {
		parsedLyrics := internal.ParseLyrics(value)
		switch l := parsedLyrics.(type) {
		case internal.PlainLyrics:
			metadata.PlainLyrics = l
		case internal.SyncedLyrics:
			metadata.SyncedLyrics = l
			metadata.PlainLyrics = l.ToPlain()
		}
	})
	ParseTag(tags, []string{"bpm", "tbp"}, func(value string) {
		bpm, err := strconv.ParseFloat(value, 64)
		if err == nil {
			metadata.Bpm = bpm
		}
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

	if !c.UseEmbeddedThumbnails || metadata.Type != internal.Video {
		if streamIndex := illustration.GetEmbeddedIllustrationStreamIndex(*probeData); streamIndex >= 0 {
			metadata.IllustrationLocation = internal.Embedded
			metadata.IllustrationStreamIndex = streamIndex
		}
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
