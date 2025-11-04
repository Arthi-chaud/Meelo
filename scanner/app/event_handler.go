package main

import (
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/tasks"
	"github.com/rs/zerolog/log"
)

// Warning: follows values from C library. Do not modify
// https://github.com/e-dant/watcher/blob/release/watcher-c/include/wtr/watcher-c.h

type EventType int

const (
	Startup      EventType = -1
	Renamed      EventType = 0
	Modified     EventType = 1
	Create       EventType = 2
	Deleted      EventType = 3
	OwnerChanged EventType = 4
	Other        EventType = 5
)

func OnLibraryEvent(triggerPath string, eventType EventType, l api.Library, s *ScannerContext) {
	tasksToAdd := []tasks.Task{}
	switch eventType {
	case Startup:
		tasksToAdd = append(tasksToAdd, tasks.NewLibraryScanTask(l, *s.config))
	case Renamed:
		tasksToAdd = append(tasksToAdd, tasks.NewLibraryCleanTask(l, *s.config), tasks.NewLibraryScanTask(l, *s.config))
	case Modified:
		break // TODO refresh metadata
	case Create:
		tasksToAdd = append(tasksToAdd, tasks.NewLibraryScanTask(l, *s.config))
	case Deleted:
		tasksToAdd = append(tasksToAdd, tasks.NewLibraryCleanTask(l, *s.config))
	case OwnerChanged:
		break // NOOP
	case Other:
		break // NOOP
	default:
		break
	}
	for _, task := range tasksToAdd {
		added := s.worker.AddTaskIfNoneEquivalent(task)
		if added {
			log.Info().
				Str("library", l.Name).
				Str("task", task.Type.String()).
				Msg("Adding task after file-system event")

		}
	}
}
