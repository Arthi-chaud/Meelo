package watcher

// #include "wtr/watcher-c.h"
// #include <stdio.h>
// void callback(struct wtr_watcher_event event)
// {
//   printf(
//     "path name: %s, "
//     "effect type: %d "
//     "path type: %d, "
//     "effect time: %lld, "
//     "associated path name: %s\n",
//     event.path_name,
//     event.effect_type,
//     event.path_type,
//     event.effect_time,
//     event.associated_path_name ? event.associated_path_name : "");
// }
//
import "C"
import (
	"fmt"
	"unsafe"
)

type Watcher struct {
	handle unsafe.Pointer
}

// TODO Add callback
// Path must be absolute
func NewWatcher(path string) (Watcher, error) {
	handle := C.wtr_watcher_open(C.CString(path), (*[0]byte)(C.callback), nil)
	if handle == nil {
		return Watcher{}, fmt.Errorf("Spawning a watcher failed")
	}
	return Watcher{handle}, nil
}

func (w Watcher) Close() {
	C.wtr_watcher_close(w.handle)
}
