package watcher

import (
	"path"
	"time"

	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/rs/zerolog/log"
)

var LibraryPollInterval time.Duration = 5 * time.Second

// Uses polling to look for new libraries,

// - setups watchers when new ones are created
// - kills watcher when associated library is deleted
// - update path of watcher when library path changes
func WatchLibraries(c config.Config) {
	watcherContext := WatcherContext{LibraryWatchers: []LibraryWatcher{}}
	for {
		libraries, err := api.GetAllLibraries(c)
		if err != nil {
			log.Error().Msgf("Polling libraries failed. %s", err.Error())
			time.Sleep(LibraryPollInterval)
			continue
		}
		watcherContext.CloseDeletedLibraries(libraries)
		for _, library := range libraries {
			libraryWatcher := watcherContext.GetLibraryWatcherByLibraryId(library.Id)
			if libraryWatcher == nil {
				newWatcher, err := NewLibraryWatcher(c, library)
				if err != nil {
					log.Error().
						Str("library", library.Name).
						Msgf("Failed to create watcher. %s", err.Error())

				} else {
					log.Info().
						Str("library", library.Name).
						Msgf("Watcher created")
					watcherContext.LibraryWatchers = append(watcherContext.LibraryWatchers, newWatcher)
				}
			} else if libraryWatcher.Library.Path != library.Path {
				err := libraryWatcher.UpdateLibrary(c, library)
				if err != nil {
					log.Error().
						Str("library", library.Name).
						Msgf("Failed to update watcher. %s", err.Error())
				} else {
					log.Info().
						Str("library", library.Name).
						Msgf("Watcher updated")
				}
			}
		}

		time.Sleep(LibraryPollInterval)
	}
}

/// Context

type WatcherContext struct {
	LibraryWatchers []LibraryWatcher
}

// Closes and deletes watcher for libraries that weren't listed in the poll
func (c *WatcherContext) CloseDeletedLibraries(libraries []api.Library) {
	aliveLibraryWatcher := []LibraryWatcher{}
	for _, libraryWatcher := range c.LibraryWatchers {
		libraryExists := false
		for _, l := range libraries {
			if l.Id == libraryWatcher.Library.Id {
				libraryExists = true
				break
			}
		}
		if !libraryExists {
			libraryWatcher.Close()
			log.Warn().
				Str("library", libraryWatcher.Library.Name).
				Msg("Deleted watcher")
		} else {
			aliveLibraryWatcher = append(aliveLibraryWatcher, libraryWatcher)
		}
	}
	c.LibraryWatchers = aliveLibraryWatcher
}

func (c *WatcherContext) GetLibraryWatcherByLibraryId(id int) *LibraryWatcher {
	for _, lw := range c.LibraryWatchers {
		if lw.Library.Id == id {
			return &lw
		}
	}
	return nil
}

// Watcher

type LibraryWatcher struct {
	Library api.Library
	Watcher Watcher
}

func NewLibraryWatcher(c config.Config, l api.Library) (LibraryWatcher, error) {
	absPath := path.Join(c.DataDirectory, l.Path)
	watcher, err := NewWatcher(absPath)
	if err != nil {
		return LibraryWatcher{}, err
	}
	return LibraryWatcher{Library: l, Watcher: watcher}, nil
}

func (lw *LibraryWatcher) UpdateLibrary(c config.Config, l api.Library) error {
	absPath := path.Join(c.DataDirectory, l.Path)
	w, err := NewWatcher(absPath)
	if err != nil {
		return err
	}
	lw.Watcher.Close()
	lw.Watcher = w
	lw.Library = l
	return nil
}

func (l *LibraryWatcher) Close() {
	l.Watcher.Close()
}
