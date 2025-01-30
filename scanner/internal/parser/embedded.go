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
	if value, err := GetValue(tags, "artist"); err == nil {
		metadata.Artist = value
	}
	if value, err := GetValue(tags, "album"); err == nil {
		metadata.Album = value
	}
	if value, err := GetValue(tags, "album_artist"); err == nil {
		metadata.AlbumArtist = value
	}
	if value, err := GetValue(tags, "title"); err == nil {
		metadata.Name = value
	}
	if value, err := GetValue(tags, "genre"); err == nil {
		metadata.Genres = []string{value}
	}
	if value, err := GetValue(tags, "track"); err == nil {
		rawTrackValue, _, _ := strings.Cut(value, "/")
		trackValue, _ := strconv.Atoi(rawTrackValue)
		metadata.Index = int64(trackValue)
	}
	if value, err := GetValue(tags, "disc"); err == nil {
		rawDiscValue, _, _ := strings.Cut(value, "/")
		discValue, _ := strconv.Atoi(rawDiscValue)
		metadata.DiscIndex = int64(discValue)
	}
	if value, err := GetValue(tags, "date"); err == nil {
		// iTunes purchases use an ISO format
		for _, format := range []string{"2006", time.DateOnly, time.DateTime, time.RFC3339} {
			date, err := time.Parse(format, value)
			if err == nil {
				metadata.ReleaseDate = &date
			}
		}
	}
	if metadata.ReleaseDate == nil {
		if value, err := GetValue(tags, "year"); err == nil {
			// MP3s only store year(?)
			date, err := time.Parse("2006", value)
			if err == nil {
				metadata.ReleaseDate = &date
			}
		}
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
