package main

import (
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	t "github.com/Arthi-chaud/Meelo/scanner/internal/tasks"
)

type ScannerContext struct {
	config *config.Config
	_taskQueue chan t.Task
	_tasks  []t.Task
}

func (s ScannerContext) getTasks() []t.Task {
	return s._tasks;
}

func (s ScannerContext) pushTaskToQueue(task t.Task) {
	s._taskQueue <- task;
}
