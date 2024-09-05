package tasks

import (
	"fmt"
	"reflect"

	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
)

func NewMetadataRefreshTask(refreshSelector api.FileSelectorDto, c config.Config) Task {
	name := generateTaskName(refreshSelector)
	return createTask(name, func(w *Worker) error { return execRefresh(refreshSelector, c, w) })
}

func execRefresh(refreshSelector api.FileSelectorDto, c config.Config, w *Worker) error {
	selectedFiles, err := api.GetAllFiles(refreshSelector, c)
	if err != nil {
		return err
	}
	// filter files that need to me refreshed
	// api.put metadata
	// api.POST illustration
	// api.POST thumbnail
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
