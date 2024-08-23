package tasks

import (
	"fmt"
	"time"
)

type Task interface {
	Name() string
	Exec() error
}

type LibraryScan struct {
	LibrarySlug string
}

type LibraryClean struct {
	LibrarySlug string
}

func (l LibraryScan) Name() string {
	return fmt.Sprintf("Scan library %s.", l.LibrarySlug)
}

func (l LibraryScan) Exec() error {
	time.Sleep(time.Second * 10)
	return nil
}

func (l LibraryClean) Name() string {
	return fmt.Sprintf("Clean library %s.", l.LibrarySlug)
}
