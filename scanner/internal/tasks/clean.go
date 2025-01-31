package tasks

import (
	"fmt"
	"path"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/filesystem"
	"github.com/kpango/glg"
)

func NewLibraryCleanTask(library api.Library, c config.Config) Task {
	name := fmt.Sprintf("Clean library '%s'.", library.Slug)
	return createTask(name, func(w *Worker) error { return execClean(library, c, w) })
}

func execClean(library api.Library, c config.Config, w *Worker) error {
	registeredFiles, err := api.GetAllFiles(api.FileSelectorDto{Library: library.Slug}, c)
	if err != nil {
		return err
	}
	filesInDir, err := filesystem.GetAllFilesInDirectory(path.Join(c.DataDirectory, library.Path))
	if err != nil {
		return err
	}
	filesToClean := []api.File{}
	for _, registeredFile := range registeredFiles {
		fullRegisteredPath := path.Join(c.DataDirectory, library.Path, registeredFile.Path)
		if !internal.Contains(filesInDir, fullRegisteredPath) {
			filesToClean = append(filesToClean, registeredFile)
		}
	}
	successfulClean := DeleteFilesInApi(filesToClean, c, w)
	glg.Logf("Cleaned %d files for Library '%s'.", successfulClean, library.Slug)
	return nil
}

func DeleteFilesInApi(filesToClean []api.File, c config.Config, w *Worker) int {
	err := api.DeleteFiles(c, internal.Fmap(filesToClean, func(f api.File, _ int) int {
		return f.Id
	}))
	if err != nil {
		glg.Fail("Cleaning files failed.")
		glg.Trace(err.Error())
		return 0
	}
	return len(filesToClean)
}
