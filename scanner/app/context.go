package main

import (
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	t "github.com/Arthi-chaud/Meelo/scanner/internal/tasks"
)

type ScannerContext struct {
	config *config.Config
	worker *t.Worker
}
