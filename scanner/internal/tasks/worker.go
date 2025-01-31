package tasks

import (
	"sync"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/kpango/glg"
)

type Worker struct {
	taskQueue      chan Task
	thumbnailQueue chan ThumbnailTask
	currentTask    Task
	queuedTasks    []Task
	mu             sync.Mutex
	wg             sync.WaitGroup
}

func NewWorker() *Worker {
	return &Worker{
		taskQueue:      make(chan Task),
		thumbnailQueue: make(chan ThumbnailTask),
	}
}

func (w *Worker) StartWorker(c config.Config) {
	go func() {
		for task := range w.taskQueue {
			w.process(task)
		}
	}()
	go func() {
		for task := range w.thumbnailQueue {
			if err := SaveThumbnail(task, c); err != nil {
				glg.Fail("Extracting thumbnail failed:")
				glg.Trace(err.Error())
			}
		}
	}()
}

func (w *Worker) process(task Task) {
	defer w.wg.Done() // Decrement the WaitGroup counter when the task is done

	w.mu.Lock()
	w.queuedTasks = removeTask(w.queuedTasks, task.Id)
	w.currentTask = task
	w.mu.Unlock()

	glg.Logf("Processing task: %s", task.Name)
	err := task.Exec(w)
	if err != nil {
		glg.Failf("Task returned an error: %s", task.Name)
		glg.Trace(err.Error())
	} else {
		glg.Logf("Task finished successfully: %s", task.Name)
	}
	w.mu.Lock()
	w.currentTask = Task{}
	w.mu.Unlock()
}

// AddTask adds a task to the queue and tracks it
func (w *Worker) AddTask(task Task) Task {
	w.mu.Lock()
	w.queuedTasks = append(w.queuedTasks, task)
	w.mu.Unlock()

	w.wg.Add(1)
	go func() {
		w.taskQueue <- task
	}()
	return task
}

func removeTask(tasks []Task, id string) []Task {
	for i, task := range tasks {
		if task.Id == id {
			// https://stackoverflow.com/questions/37334119/how-to-delete-an-element-from-a-slice-in-golang
			return append(tasks[:i], tasks[i+1:]...)
		}
	}
	return tasks
}

func (w *Worker) GetCurrentTasks() (TaskInfo, []TaskInfo) {
	w.mu.Lock()
	defer w.mu.Unlock()

	return w.currentTask.GetInfo(), internal.Fmap(w.queuedTasks, func(task Task, i int) TaskInfo {
		return task.GetInfo()
	})
}
