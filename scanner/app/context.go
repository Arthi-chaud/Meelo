package main

import (
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/worker"
)

type ScannerContext struct {
	config *config.Config
	worker *worker.Worker
}
