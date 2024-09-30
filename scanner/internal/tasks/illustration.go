package tasks

import (
	"fmt"
	"os"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/illustration"
	"github.com/kpango/glg"
)

func SaveThumbnail(t ThumbnailTask, c config.Config) error {
	thumbnailPosition := int64(t.TrackDuration / 2)
	if t.TrackDuration == 0 {
		t.TrackDuration = 5 // this is abitrary. If the scan os path only, we do not get the duration.
	}

	thumbnailbytes, err := illustration.GetFrame(t.FilePath, thumbnailPosition)
	if err != nil {
		return err
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
			glg.Fail(err.Error())
			return fmt.Errorf("an error occured while extracting embedded illustration")
		}
	case internal.Inline:
		bytes, err = os.ReadFile(t.IllustrationPath)
		if err != nil {
			glg.Fail(err.Error())
			return fmt.Errorf("an error occured while extracting embedded illustration")
		}
	default:
		return fmt.Errorf("invalid illustration source: %s", string(t.IllustrationLocation))
	}
	return api.PostIllustration(c, t.TrackId, api.Cover, bytes)
}
