package tasks

import (
	"fmt"

	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
)

func NewMetadataRefreshTask(refreshSelector api.MetadataRefreshDto, c config.Config) Task {
	name := generateTaskName(refreshSelector)
	return createTask(name, func(w *Worker) error { return execRefresh(refreshSelector, c, w) })
}

func execRefresh(refreshSelector api.MetadataRefreshDto, c config.Config, w *Worker) error {
	return nil
}

func generateTaskName(refreshSelector api.MetadataRefreshDto) string {
	formattedSelector := ""

	if len(refreshSelector.LibraryIdentifier) > 0 {
		formattedSelector = fmt.Sprintf("library=%s", refreshSelector.LibraryIdentifier)
	}
	if len(refreshSelector.AlbumIdentifier) > 0 {
		formattedSelector = fmt.Sprintf("album=%s", refreshSelector.AlbumIdentifier)
	}
	if len(refreshSelector.ReleaseIdentifier) > 0 {
		formattedSelector = fmt.Sprintf("release=%s", refreshSelector.ReleaseIdentifier)
	}
	if len(refreshSelector.SongIdentifier) > 0 {
		formattedSelector = fmt.Sprintf("song=%s", refreshSelector.SongIdentifier)
	}
	if len(refreshSelector.TrackIdentifier) > 0 {
		formattedSelector = fmt.Sprintf("track=%s", refreshSelector.TrackIdentifier)
	}
	return fmt.Sprintf("Refresh metadata '%s'", formattedSelector)
}
