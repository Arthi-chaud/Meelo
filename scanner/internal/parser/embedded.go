package parser

import (
	"context"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"gopkg.in/vansante/go-ffprobe.v2"
)

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
	if value, err := tags.GetString("artist"); err == nil {
		metadata.Artist = value
	}
	if value, err := tags.GetString("album"); err == nil {
		metadata.Album = value
	}
	if value, err := tags.GetString("album_artist"); err == nil {
		metadata.AlbumArtist = value
	}
	if value, err := tags.GetString("title"); err == nil {
		metadata.Name = value
	}
	if value, err := tags.GetString("genre"); err == nil {
		metadata.Genres = []string{value}
	}
	if value, err := tags.GetString("track"); err == nil {
		rawTrackValue, _, _ := strings.Cut(value, "/")
		trackValue, _ := strconv.Atoi(rawTrackValue)
		metadata.Index = int64(trackValue)
	}
	if value, err := tags.GetString("disc"); err == nil {
		rawDiscValue, _, _ := strings.Cut(value, "/")
		discValue, _ := strconv.Atoi(rawDiscValue)
		metadata.DiscIndex = int64(discValue)
	}
	if value, err := tags.GetString("date"); err == nil {

		date, err := time.Parse("2006", value)
		if err == nil {
			metadata.ReleaseDate = date
		}
	}
	return metadata, errors
}

func getType(probeData ffprobe.ProbeData) internal.TrackType {
	videoStream := probeData.FirstVideoStream()
	if videoStream == nil || videoStream.Disposition.AttachedPic == 1 {
		return internal.Audio
	}
	return internal.Video
}
