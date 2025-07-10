package tasks

import (
	"path"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/rs/zerolog/log"
)

// Push parsed metadata and saves related illustration/thumbnail
func pushMetadata(fileFullPath string, m internal.Metadata, c config.Config, w *Worker, updateMethod api.SaveMetadataMethod) error {
	created, err := api.SaveMetadata(c, m, updateMethod)
	if err != nil {
		return err
	}
	if len(m.IllustrationLocation) > 0 {
		err := SaveIllustration(IllustrationTask{
			IllustrationLocation:    m.IllustrationLocation,
			IllustrationPath:        m.IllustrationPath,
			TrackPath:               fileFullPath,
			TrackId:                 created.TrackId,
			IllustrationStreamIndex: m.IllustrationStreamIndex,
		}, c)
		if err != nil {
			// Illustration POST failure is not fatal
			// So we do not return an error to the caller
			log.Error().
				Str("path", path.Base(fileFullPath)).
				Msgf("Saving illustration failed")
			log.Trace().Msg(err.Error())
		}
	}

	hasPlainLyrics := len(internal.Filter(m.PlainLyrics, func(s string) bool {
		return len(s) > 0
	})) > 0
	hasSyncedLyrics := len(m.SyncedLyrics) > 0
	if hasPlainLyrics && created.SongId != 0 {
		hadPlainLyrics, hadSyncedLyrics, _ := api.HasLyrics(c, created.SongId)
		if !hadPlainLyrics || (!hadSyncedLyrics && hasSyncedLyrics) {
			syncedLyrics := &m.SyncedLyrics
			if !hasSyncedLyrics {
				syncedLyrics = nil
			}
			err := api.PostLyrics(c, created.SongId, m.PlainLyrics, syncedLyrics)
			if err != nil {
				log.Error().Msg("Could not POST lyrics")
				log.Trace().Msg(err.Error())
			}
		}
	}
	if m.Type == internal.Video {
		go func() {
			w.thumbnailQueue <- ThumbnailTask{
				TrackId:       created.TrackId,
				TrackDuration: int(m.Duration),
				FilePath:      fileFullPath,
			}
		}()
	}
	return nil
}
