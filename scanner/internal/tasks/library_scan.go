package tasks

import (
	"fmt"
	"time"

	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
)

func NewLibraryScanTask(librarySlug string, c config.Config) Task {
	name := fmt.Sprintf("Scan library %s.", librarySlug)
	return createTask(name, func() error { return exec(librarySlug, c) })
}

func exec(librarySlug string, c config.Config) error {
	time.Sleep(time.Second * 10)
	return nil
}
