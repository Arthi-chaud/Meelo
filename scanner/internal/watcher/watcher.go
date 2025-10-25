package watcher

// #include "wtr/watcher-c.h"
// #include <stdio.h>
// void callback(struct wtr_watcher_event event, void* data)
// {
//   int* count = (int*)data;
//   *count += 1;
//   printf(
//     "count: %d, "
//     "path name: %s, "
//     "effect type: %d "
//     "path type: %d, "
//     "effect time: %lld, "
//     "associated path name: %s\n",
//     *count,
//     event.path_name,
//     event.effect_type,
//     event.path_type,
//     event.effect_time,
//     event.associated_path_name ? event.associated_path_name : "");
// }
//
import "C"
import (
	"unsafe"
)

func WatchDir() {
	var vC C.int
	vC = 10000
	C.wtr_watcher_open(C.CString("/data"), (*[0]byte)(C.callback), unsafe.Pointer(&vC))
	// for {
	// 	log.Print("a")
	// 	time.Sleep(5)
	// 	// os.Stdin.Read(b)
	// }
}
