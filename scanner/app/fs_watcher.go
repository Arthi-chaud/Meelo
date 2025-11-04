package main

//#cgo LDFLAGS: -Wl,--allow-multiple-definition
// #include "wtr/watcher-c.h"
// #include <stdio.h>
// typedef struct wtr_watcher_event WatcherEvent;
// void onEvent(WatcherEvent event, int libraryId);
// static void go_callback(WatcherEvent event, void *data)
// {
//   onEvent(event, (int)data);
// }
// void *go_callback_ptr = (void*)go_callback;
//
import "C"
import (
	"fmt"
	"strings"
	"unsafe"

	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/rs/zerolog/log"
)

var WatcherIsLivePrefix string = "/self/live@"

//export onEvent
func onEvent(event C.WatcherEvent, libraryIdC C.int) {
	if contextPtr == nil || watcherContext == nil {
		log.Error().Msg("Received file-system event, but the global config/context is nil. Ignoring")
		return
	}
	libraryId := int(libraryIdC)
	var library api.Library = api.Library{}
	for _, w := range watcherContext.LibraryWatchers {
		lib := w.Library
		if lib.Id == libraryId {
			library = lib
			break
		}
	}
	if library.Id == 0 {
		log.Error().Msg("Couldn't resolve library FS event payload. Ignoring")
		return
	}
	eventType := EventType(event.effect_type)
	triggerPath := C.GoString(event.path_name)
	if strings.HasPrefix(triggerPath[1:], WatcherIsLivePrefix) {
		if triggerPath[0] != 's' { // If the 'live' event is not a success, ignore
			return
		}
		triggerPath = triggerPath[1+len(WatcherIsLivePrefix):]
		eventType = Startup
	}
	OnLibraryEvent(triggerPath, eventType, library, contextPtr)
}

var contextPtr *ScannerContext = nil

type Watcher struct {
	handle unsafe.Pointer
}

// Path must be absolute
func NewWatcher(path string, l api.Library, s *ScannerContext) (Watcher, error) {
	if contextPtr == nil {
		contextPtr = s
	}
	libraryIdCInt := C.int(l.Id)
	handle := C.wtr_watcher_open(C.CString(path), (*[0]byte)(C.go_callback_ptr), unsafe.Pointer(uintptr(libraryIdCInt)))
	if handle == nil {
		return Watcher{}, fmt.Errorf("Spawning a watcher failed")
	}
	return Watcher{handle}, nil
}

func (w Watcher) Close() {
	C.wtr_watcher_close(w.handle)
}
