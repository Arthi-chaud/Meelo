package main

//#cgo LDFLAGS: -Wl,--allow-multiple-definition
// #include "wtr/watcher-c.h"
// #include <stdio.h>
// void OnEvent();
// static void go_callback(struct wtr_watcher_event event, void *data)
// {
//   OnEvent();
// }
// void *go_callback_ptr = (void*)go_callback;
//
import "C"
import (
	"fmt"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"unsafe"
)

type Watcher struct {
	handle unsafe.Pointer
}

// Path must be absolute
func NewWatcher(path string, c *config.Config) (Watcher, error) {
	if configPtr == nil {
		configPtr = c
	}
	handle := C.wtr_watcher_open(C.CString(path), (*[0]byte)(C.go_callback_ptr), nil)
	if handle == nil {
		return Watcher{}, fmt.Errorf("Spawning a watcher failed")
	}
	return Watcher{handle}, nil
}

func (w Watcher) Close() {
	C.wtr_watcher_close(w.handle)
}
