package tasks

import (
	"strconv"
	"sync"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/rs/zerolog/log"
)

type Worker struct {
	taskQueue      chan Task
	thumbnailQueue chan ThumbnailTask
	currentTask    Task
	queuedTasks    []Task
	progress       int // A number between 0 and 100
	mu             sync.Mutex
	wg             sync.WaitGroup
}

func NewWorker() *Worker {
	return &Worker{
		taskQueue:      make(chan Task),
		thumbnailQueue: make(chan ThumbnailTask),
	}
}

func (w *Worker) StartWorker(c *config.Config) {
	go func() {
		for task := range w.taskQueue {
			w.process(task)
		}
	}()
	go func() {
		for task := range w.thumbnailQueue {
			if err := SaveThumbnail(task, *c); err != nil {
				log.Error().Msg("Extracting thumbnail failed:")
				log.Trace().Msg(err.Error())
			}
		}
	}()
}

func (w *Worker) SetProgress(stepsFinished int, stepsCount int) {
	if stepsCount == 0 {
		log.Error().Msg("Could not set progress for task. Step count is zero.")
	}
	newProgress := int(float64(100*stepsFinished) / float64(stepsCount))
	if newProgress < 0 || newProgress > 100 {
		log.Warn().
			Str("input", strconv.Itoa(newProgress)).
			Msg("Attempt to set a progress value out of bound")
		return
	}
	w.mu.Lock()
	w.progress = newProgress
	w.mu.Unlock()
}

func (w *Worker) process(task Task) {
	defer w.wg.Done() // Decrement the WaitGroup counter when the task is done

	w.mu.Lock()
	w.queuedTasks = removeTask(w.queuedTasks, task.Id)
	w.currentTask = task
	w.progress = 0
	w.mu.Unlock()

	log.Info().Str("task", task.Name).Msgf("Processing task")
	err := task.Exec(w)
	if err != nil {
		log.Error().Str("task", task.Name).Msgf("Task returned an error")
		log.Trace().Msg(err.Error())
	} else {
		log.Info().Str("task", task.Name).Msgf("Task finished successfully")
	}
	w.mu.Lock()
	w.currentTask = Task{}
	w.progress = 0
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

func (w *Worker) GetCurrentTasks() (TaskInfo, int, []TaskInfo) {
	w.mu.Lock()
	defer w.mu.Unlock()

	return w.currentTask.GetInfo(), w.progress, internal.Fmap(w.queuedTasks, func(task Task, i int) TaskInfo {
		return task.GetInfo()
	})
}
