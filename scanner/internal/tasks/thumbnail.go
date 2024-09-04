package tasks

import (
	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
)

func SaveThumbnail(t ThumbnailTask, c config.Config) error {
	thumbnailPosition := int64(t.TrackDuration / 2)
	if t.TrackDuration == 0 {
		t.TrackDuration = 5 // this is abitrary. If the scan os path only, we do not get the duration.
	}

	thumbnailbytes, err := internal.GetFrame(t.FilePath, thumbnailPosition)
	if err != nil {
		return err
	}
	return api.PostThumbnail(c, t.TrackId, thumbnailbytes)
}
