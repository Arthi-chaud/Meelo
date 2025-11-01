package main

import (
	"fmt"

	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
)
import "C"

//export OnEvent
func OnEvent() {
	fmt.Print("ON EVENT\n")
}

var configPtr *config.Config = nil
