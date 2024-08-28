package worker

import (
	"sync"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	t "github.com/Arthi-chaud/Meelo/scanner/internal/tasks"
	"github.com/kpango/glg"
)

type Worker struct {
	taskQueue   chan t.Task
	currentTask t.Task
	queuedTasks []t.Task
	mu          sync.Mutex
	wg          sync.WaitGroup
}

func NewWorker() *Worker {
	return &Worker{
		taskQueue: make(chan t.Task),
	}
}

func (w *Worker) StartWorker() {
	go func() {
		for task := range w.taskQueue {
			w.process(task)
		}
	}()
}

func (w *Worker) process(task t.Task) {
	defer w.wg.Done() // Decrement the WaitGroup counter when the task is done

	w.mu.Lock()
	w.queuedTasks = removeTask(w.queuedTasks, task.Id)
	w.currentTask = task
	w.mu.Unlock()

	glg.Logf("Processing task: %s", task.Name)
	err := task.Exec()
	if err != nil {
		glg.Failf("Task returned an error: %s", task.Name)
		glg.Failf(err.Error())
	} else {
		glg.Logf("Task finished successfully: %s", task.Name)
	}
	w.mu.Lock()
	w.currentTask = t.Task{}
	w.mu.Unlock()
}

// AddTask adds a task to the queue and tracks it
func (w *Worker) AddTask(task t.Task) t.Task {
	w.mu.Lock()
	w.queuedTasks = append(w.queuedTasks, task)
	w.mu.Unlock()

	w.wg.Add(1)
	go func() {
		w.taskQueue <- task
	}()
	return task
}

func removeTask(tasks []t.Task, id string) []t.Task {
	for i, task := range tasks {
		if task.Id == id {
			// https://stackoverflow.com/questions/37334119/how-to-delete-an-element-from-a-slice-in-golang
			return append(tasks[:i], tasks[i+1:]...)
		}
	}
	return tasks
}

func (w *Worker) GetCurrentTasks() (t.TaskInfo, []t.TaskInfo) {
	w.mu.Lock()
	defer w.mu.Unlock()

	return w.currentTask.GetInfo(), internal.Fmap(w.queuedTasks, func(task t.Task, i int) t.TaskInfo {
		return task.GetInfo()
	})
}
