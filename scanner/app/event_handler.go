package main

import (
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/rs/zerolog/log"
)

// Warning: follows values from C library. Do not modify
// https://github.com/e-dant/watcher/blob/release/watcher-c/include/wtr/watcher-c.h

type EventType int

const (
	Renamed      EventType = 0
	Modified     EventType = 1
	Create       EventType = 2
	Deleted      EventType = 3
	OwnerChanged EventType = 4
	Other        EventType = 5
)

func OnLibraryEvent(triggerPath string, eventType EventType, l api.Library, c *config.Config) error {
	log.Info().
		Str("library", l.Name).
		Str("path", triggerPath).
		Str("event", string(eventType)).
		Msgf("File-system event from library")
	return nil
}
