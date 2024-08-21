package tasks

import "fmt"

type Task interface {
	Name() string
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

func (l LibraryClean) Name() string {
	return fmt.Sprintf("Clean library %s.", l.LibrarySlug)
}
