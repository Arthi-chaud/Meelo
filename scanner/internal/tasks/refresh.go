package tasks

import (
	"fmt"
	"path"
	"reflect"
	"strconv"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/parser"
	"github.com/rs/zerolog/log"
)

func NewMetadataRefreshTask(refreshSelector api.FileSelectorDto, force bool, c config.Config) Task {
	name := generateTaskName(refreshSelector)
	return createTask(0, Refresh, name, func(w *Worker) error {
		return execRefresh(refreshSelector, force, c, w)
	})
}

func execRefresh(refreshSelector api.FileSelectorDto, force bool, c config.Config, w *Worker) error {
	successfulUpdates := 0
	skippedUpdates := 0
	failedUpdates := 0
	libraries, err := api.GetAllLibraries(c)
	if err != nil {
		return err
	}
	selectedFiles, err := api.GetAllFiles(refreshSelector, c)
	if err != nil {
		return err
	}
	selectedFilesCount := len(selectedFiles)
	for _, selectedFile := range selectedFiles {
		w.SetProgress(skippedUpdates+failedUpdates+successfulUpdates, selectedFilesCount)
		selectedFilePath, err := buildFullFileEntryPath(selectedFile, libraries, c)
		if err != nil {
			log.Error().Msg(err.Error())
			failedUpdates++
			continue
		}
		// If force is false, compute checksum,
		// And then choose if when skip the file or not
		// If force is true, avoid computing checksum
		if force == false {
			newChecksum, err := internal.ComputeChecksum(selectedFilePath)
			if err != nil {
				log.Error().Msg(err.Error())
				failedUpdates++
				continue
			}
			if newChecksum == selectedFile.Checksum {
				skippedUpdates++
				continue
			}
		}
		log.Info().
			Str("file", path.Base(selectedFile.Path)).
			Msgf("Refreshing metadata")
		// Note unlike for scan, we dont use a chan here.
		m, errs := parser.ParseMetadata(c.UserSettings, selectedFilePath)
		if len(errs) > 0 {
			log.Error().
				Str("file", path.Base(selectedFile.Path)).
				Msgf("Parsing failed")
			for _, err := range errs {
				log.Trace().Msg(err.Error())
			}
			failedUpdates++
			continue
		}
		err = pushMetadata(selectedFilePath, m, c, w, api.Update)
		if err != nil {
			log.Error().Msg(err.Error())
			failedUpdates++
		} else {
			successfulUpdates++
		}
	}
	log.Info().
		Str("sucess", strconv.Itoa(successfulUpdates)).
		Str("failed", strconv.Itoa(failedUpdates)).
		Msg("Finished updating metadata")
	return nil
}

func generateTaskName(refreshSelector api.FileSelectorDto) string {
	formattedSelector := ""
	v := reflect.ValueOf(refreshSelector)
	typeOfS := v.Type()

	for i := 0; i < v.NumField(); i++ {
		if len(v.Field(i).String()) > 0 {
			formattedSelector = fmt.Sprintf("%s=%s", typeOfS.Field(i).Name, v.Field(i).String())
		}
	}
	return fmt.Sprintf("Refresh metadata %s", formattedSelector)
}

func buildFullFileEntryPath(file api.File, libraries []api.Library, c config.Config) (string, error) {
	for _, library := range libraries {
		if file.LibraryId != library.Id {
			continue
		}
		fullPath := path.Join(c.DataDirectory, "/", library.Path, "/", file.Path)
		return fullPath, nil
	}
	return "", fmt.Errorf("could not build back the full path of %s", path.Base(file.Path))
}
