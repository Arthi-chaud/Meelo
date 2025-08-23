package tasks

import (
	"context"
	"errors"
	"fmt"
	"os"
	"path"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/illustration"
	"github.com/rs/zerolog/log"
	"gopkg.in/vansante/go-ffprobe.v2"
)

func SaveThumbnail(t ThumbnailTask, c config.Config) error {
	if c.UserSettings.UseEmbeddedThumbnails {
		// Try to extract the embedded illustration
		ctx, cancelFn := context.WithCancel(context.Background())
		defer cancelFn()
		probeData, err := ffprobe.ProbeURL(ctx, t.FilePath)
		if err == nil {
			streamIndex := illustration.GetEmbeddedIllustrationStreamIndex(*probeData)
			if streamIndex >= 0 {
				thumbnailbytes, err := illustration.ExtractEmbeddedIllustration(t.FilePath, streamIndex)
				if err == nil {
					return api.PostIllustration(c, t.TrackId, api.Thumbnail, thumbnailbytes)
				}
			}
		}
	}

	// If we didn't get a thumbnail from the embedded illustration, extract a frame from the video
	thumbnailbytes, err := illustration.GetThumbnail(t.FilePath, int64(t.TrackDuration))
	if err != nil {
		return err
	}
	log.Info().Str("file", path.Base(t.FilePath)).Msg("Extracted thumbnail")
	return api.PostIllustration(c, t.TrackId, api.Thumbnail, thumbnailbytes)
}

func SaveIllustration(t IllustrationTask, c config.Config) error {
	var bytes []byte
	var err error

	switch t.IllustrationLocation {
	case internal.Embedded:
		bytes, err = illustration.ExtractEmbeddedIllustration(t.TrackPath, t.IllustrationStreamIndex)
		if err != nil {
			return errors.Join(fmt.Errorf("an error occured while extracting embedded illustration"), err)
		}
	case internal.Inline:
		bytes, err = os.ReadFile(t.IllustrationPath)
		if err != nil {
			return errors.Join(fmt.Errorf("an error occured while extracting embedded illustration"), err)
		}
	default:
		return fmt.Errorf("invalid illustration source: %s", string(t.IllustrationLocation))
	}
	return api.PostIllustration(c, t.TrackId, api.Cover, bytes)
}
