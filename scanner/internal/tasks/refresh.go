package tasks

import (
	"fmt"
	"path"
	"reflect"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/parser"
	"github.com/kpango/glg"
)

func NewMetadataRefreshTask(refreshSelector api.FileSelectorDto, c config.Config) Task {
	name := generateTaskName(refreshSelector)
	return createTask(name, func(w *Worker) error { return execRefresh(refreshSelector, c, w) })
}

func execRefresh(refreshSelector api.FileSelectorDto, c config.Config, w *Worker) error {
	successfulUpdates := 0
	libraries, err := api.GetAllLibraries(c)
	if err != nil {
		return err
	}
	selectedFiles, err := api.GetAllFiles(refreshSelector, c)
	if err != nil {
		return err
	}
	for _, selectedFile := range selectedFiles {
		selectedFilePath, err := buildFullFileEntryPath(selectedFile, libraries, c)
		if err != nil {
			glg.Fail(err)
			continue
		}
		newChecksum, err := internal.ComputeChecksum(selectedFilePath)
		if err != nil {
			glg.Fail(err)
			continue
		}
		if newChecksum == selectedFile.Checksum {
			continue
		}
		glg.Log("Refreshing metadata for %s.", path.Base(selectedFile.Path))
		// Note unlike for scan, we dont use a chan here.
		m, errs := parser.ParseMetadata(c.UserSettings, selectedFilePath)
		if len(errs) > 0 {
			glg.Errorf("Parsing '%s' failed:", path.Base(selectedFilePath))
			for _, err := range errs {
				glg.Trace(err.Error())
			}
			continue
		}
		err = pushMetadata(selectedFilePath, m, c, w, api.Update)
		if err != nil {
			glg.Fail(err.Error())
		} else {
			successfulUpdates = successfulUpdates + 1
		}
	}
	glg.Logf("Updated metadata for %d files", successfulUpdates)
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
	return fmt.Sprintf("Refresh metadata '%s'", formattedSelector)
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
