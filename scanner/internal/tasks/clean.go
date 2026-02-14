package tasks

import (
	"fmt"
	"path"
	"strconv"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/filesystem"
	"github.com/rs/zerolog/log"
)

func NewLibraryCleanTask(library api.Library, c config.Config) Task {
	name := fmt.Sprintf("Clean library '%s'", library.Slug)
	return createTask(library.Id, Clean, name, func(w *Worker) error { return execClean(library, c, w) })
}

func execClean(library api.Library, c config.Config, w *Worker) error {
	registeredFiles, err := api.GetAllFiles(api.FileSelectorDto{Library: library.Slug}, c)
	if err != nil {
		return err
	}
	w.SetProgress(25, 100)
	filesInDir, err := filesystem.GetAllFilesInDirectory(path.Join(c.DataDirectory, library.Path))
	if err != nil {
		return err
	}

	w.SetProgress(50, 100)
	filesToClean := []api.File{}
	for _, registeredFile := range registeredFiles {
		fullRegisteredPath := path.Join(c.DataDirectory, library.Path, registeredFile.Path)
		if !internal.Contains(filesInDir, fullRegisteredPath) {
			filesToClean = append(filesToClean, registeredFile)
		}
	}
	w.SetProgress(75, 100)
	successfulClean := DeleteFilesInApi(filesToClean, c, w)
	w.SetProgress(100, 100)
	log.Info().
		Str("cleaned", strconv.Itoa(successfulClean)).
		Str("library", library.Slug).
		Msg("Finished cleaning files")
	return nil
}

func DeleteFilesInApi(filesToClean []api.File, c config.Config, w *Worker) int {
	err := api.DeleteFiles(c, internal.Fmap(filesToClean, func(f api.File, _ int) int {
		return f.Id
	}))
	if err != nil {
		log.Error().Msg("Cleaning files failed.")
		log.Trace().Msg(err.Error())
		return 0
	}
	return len(filesToClean)
}
