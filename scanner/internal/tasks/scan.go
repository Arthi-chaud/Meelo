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
	"github.com/rs/zerolog/log"
)

func NewLibraryScanTask(library api.Library, c config.Config) Task {
	name := fmt.Sprintf("Scan library '%s'", library.Slug)
	return createTask(library.Id, Scan, name, func(w *Worker) error { return execScan(library, c, w) })
}

func execScan(library api.Library, c config.Config, w *Worker) error {
	registeredFiles, err := api.GetAllFiles(api.FileSelectorDto{Library: library.Slug}, c)
	if err != nil {
		return err
	}
	registeredPaths := internal.Fmap(registeredFiles, func(f api.File, _ int) string {
		return path.Join(c.DataDirectory, library.Path, f.Path)
	})
	filesInDir, err := filesystem.GetAllFilesInDirectory(path.Join(c.DataDirectory, library.Path))
	if err != nil {
		return err
	}
	pathsNotRegistered := []string{}
	for _, fileInDir := range filesInDir {
		if strings.HasPrefix(path.Base(fileInDir), ".") {
			// Ignore hidden files
			continue
		}
		if internal.Contains(registeredPaths, fileInDir) {
			// File is already in library
			continue
		}
		stringMime := mime.TypeByExtension(path.Ext(fileInDir))
		if strings.HasPrefix(stringMime, "video/") || strings.HasPrefix(stringMime, "audio/") {
			pathsNotRegistered = append(pathsNotRegistered, fileInDir)
		} else if !strings.HasPrefix(stringMime, "image/") {
			log.Warn().
				Str("file", path.Base(fileInDir)).
				Msg("File does not seem to be an audio or video file. Ignored.")
		}
	}
	log.Debug().
		Str("library", library.Slug).
		Msgf("Library has %d new files", len(pathsNotRegistered))
	successfulRegistrations := scanAndPostFiles(pathsNotRegistered, c, w)
	log.Info().
		Str("library", library.Slug).
		Msgf("Library has registered %d new files", successfulRegistrations)
	return nil
}

func scanAndPostFiles(filePaths []string, c config.Config, w *Worker) int {
	const chunkSize = 5
	successfulRegistrations := 0
	failedRegistration := 0
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
			baseFile := path.Base(res.filePath)
			if len(res.errors) != 0 {
				log.Error().Str("file", baseFile).Msg("Parsing failed")
				for _, err := range res.errors {
					log.Trace().Msg(err.Error())
				}
				failedRegistration = failedRegistration + 1
			} else {
				log.Info().Str("file", baseFile).Msg("Parsing successful")
				err := pushMetadata(res.filePath, res.metadata, c, w, api.Create)
				if err != nil {
					log.Error().Str("file", baseFile).Msg("Could not POST metadata")
					log.Trace().Msg(err.Error())
					failedRegistration = failedRegistration + 1
				} else {
					successfulRegistrations = successfulRegistrations + 1
				}
			}
		}
		w.SetProgress(successfulRegistrations+failedRegistration, fileCount)
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
