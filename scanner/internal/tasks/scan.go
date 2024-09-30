package tasks

import (
	"fmt"
	"math"
	"mime"
	"path"
	"strings"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/filesystem"
	"github.com/Arthi-chaud/Meelo/scanner/internal/parser"
	"github.com/kpango/glg"
)

func NewLibraryScanTask(library api.Library, c config.Config) Task {
	name := fmt.Sprintf("Scan library '%s'.", library.Slug)
	return createTask(name, func(w *Worker) error { return execScan(library, c, w) })
}

func execScan(library api.Library, c config.Config, w *Worker) error {
	registeredFiles, err := api.GetAllFiles(api.FileSelectorDto{Library: library.Slug}, c)
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
		if strings.HasPrefix(stringMime, "video/") || strings.HasPrefix(stringMime, "audio/") {
			pathsNotRegistered = append(pathsNotRegistered, fileInDir)
		} else if !strings.HasPrefix(stringMime, "image/") {
			glg.Warnf("File '%s' does not seem to be an audio or video file. Ignored.", path.Base(fileInDir))
		}
	}
	glg.Debugf("Library '%s' has %d new files", library.Slug, len(pathsNotRegistered))
	successfulRegistrations := scanAndPostFiles(pathsNotRegistered, c, w)
	glg.Logf("Library '%s' has registered %d new files", library.Slug, successfulRegistrations)
	return nil
}

func scanAndPostFiles(filePaths []string, c config.Config, w *Worker) int {
	const chunkSize = 5
	successfulRegistrations := 0
	scanResChan := make(chan ScanRes, chunkSize)
	defer close(scanResChan)
	fileCount := len(filePaths)
	for i := 0; i < fileCount; i += chunkSize {
		filesChunk := filePaths[i:(int)(math.Min(float64(i+chunkSize), float64(fileCount)))]
		for _, file := range filesChunk {
			go scanAndPushResToChan(file, c.UserSettings, scanResChan)
		}
		for range len(filesChunk) {
			res := <-scanResChan
			if len(res.errors) != 0 {
				glg.Errorf("Parsing '%s' failed:", res.filePath)
				for _, err := range res.errors {
					glg.Trace(err.Error())
				}
				continue
			}
			glg.Logf("Parsing metadata for '%s' successful.", path.Base(res.filePath))
			err := pushMetadata(res.filePath, res.metadata, c, w, api.Create)
			if err != nil {
				glg.Fail(err.Error())
			} else {
				successfulRegistrations = successfulRegistrations + 1
			}
		}
	}
	return successfulRegistrations
}

type ScanRes struct {
	filePath string
	metadata internal.Metadata
	errors   []error
}

func scanAndPushResToChan(filePath string, c config.UserSettings, outputChan chan ScanRes) {
	metadata, errors := parser.ParseMetadata(c, filePath)
	outputChan <- ScanRes{
		filePath: filePath,
		metadata: metadata,
		errors:   errors,
	}
}
