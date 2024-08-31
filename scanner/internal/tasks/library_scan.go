package tasks

import (
	"fmt"
	"mime"
	"path"
	"strings"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/filesystem"
	"github.com/kpango/glg"
)

func NewLibraryScanTask(library api.Library, c config.Config) Task {
	name := fmt.Sprintf("Scan library '%s'.", library.Slug)
	return createTask(name, func() error { return exec(library, c) })
}

func exec(library api.Library, c config.Config) error {
	registeredFiles, err := api.GetAllFilesInLibrary(library.Slug, c)
	if err != nil {
		return err
	}
	registeredPaths := internal.Fmap(registeredFiles, func(f api.File, _ int) string {
		return path.Join(c.DataDirectory, library.Path, f.Path)
	})
	glg.Debugf("Library has %d files", len(registeredFiles))
	filesInDir, err := filesystem.GetAllFilesInDirectory(path.Join(c.DataDirectory, library.Path))
	if err != nil {
		return err
	}
	pathsNotRegistered := []string{}
	for _, fileInDir := range filesInDir {
		if internal.Contains(registeredPaths, fileInDir) {
			// File is already in library
			continue
		}
		stringMime := mime.TypeByExtension(path.Ext(fileInDir))
		if (strings.HasPrefix(stringMime, "video/") || strings.HasPrefix(stringMime, "audio/")) {
			pathsNotRegistered = append(pathsNotRegistered, fileInDir)
		} else {
			glg.Warnf("File '%s' does not seem to be an audio or video file", path.Base(fileInDir))
		}
	}
	glg.Debugf("Library '%s' has %d new files", library.Slug, len(pathsNotRegistered))

	return nil
}
