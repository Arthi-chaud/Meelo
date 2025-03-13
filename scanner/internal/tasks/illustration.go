package tasks

import (
	"context"
	"errors"
	"fmt"
	"os"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/illustration"
	"gopkg.in/vansante/go-ffprobe.v2"
)

func SaveThumbnail(t ThumbnailTask, c config.Config) error {
	var thumbnailbytes []byte
	var err error
	var hasValidEmbeddedThumbnail bool = false

	// If the video has an embedded illustration, we try to use that as the thumbnail
	ctx, cancelFn := context.WithCancel(context.Background())
	defer cancelFn()
	// Try to extract embedded thumbnail if available
	if probeData, err := ffprobe.ProbeURL(ctx, t.FilePath); err == nil {
		if streamIndex := illustration.GetEmbeddedIllustrationStreamIndex(*probeData); streamIndex >= 0 {
			// We found an embedded image stream, now we check if it's a valid thumbnail
			// A thumbnail is "valid" if it has the same aspect ratio as the video (with a margin of error of 5%)
			const marginOfError = 0.05
			var videoWidth, videoHeight float64
			var imageWidth, imageHeight float64

			// Get video dimensions
			for _, stream := range probeData.Streams {
				if stream != nil && stream.CodecType == "video" && stream.Index != streamIndex {
					videoWidth = float64(stream.Width)
					videoHeight = float64(stream.Height)
					break
				}
			}

			// Get image dimensions
			for _, stream := range probeData.Streams {
				if stream != nil && stream.Index == streamIndex {
					imageWidth = float64(stream.Width)
					imageHeight = float64(stream.Height)
					break
				}
			}

			// Check aspect ratio
			if videoWidth > 0 && videoHeight > 0 && imageWidth > 0 && imageHeight > 0 {
				videoAspect := videoWidth / videoHeight
				imageAspect := imageWidth / imageHeight

				if imageAspect >= videoAspect*(1-marginOfError) && imageAspect <= videoAspect*(1+marginOfError) {
					// Try to extract the embedded thumbnail
					var extractErr error
					thumbnailbytes, extractErr = illustration.ExtractEmbeddedIllustration(t.FilePath, streamIndex)
					if extractErr == nil {
						hasValidEmbeddedThumbnail = true
					}
				}
			}
		}
	}

	// If there is no valid embedded illustration, we instead extract a frame from the video
	if !hasValidEmbeddedThumbnail {
		thumbnailPosition := int64(t.TrackDuration / 2)
		if t.TrackDuration == 0 {
			t.TrackDuration = 5 // this is abitrary. If the scan os path only, we do not get the duration.
		}

		thumbnailbytes, err = illustration.GetFrame(t.FilePath, thumbnailPosition)
		if err != nil {
			return err
		}
	}

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
