package tasks

import (
	"github.com/google/uuid"
)

type Task struct {
	Id   string
	Name string
	Exec func(w *Worker) error
}

type TaskInfo struct {
	Id   string
	Name string
}

func (t Task) GetInfo() TaskInfo {
	return TaskInfo{Id: t.Id, Name: t.Name}
}

func createTask(name string, exec func(w *Worker) error) Task {
	return Task{
		Id:   uuid.New().String(),
		Name: name,
		Exec: exec,
	}
}

type ThumbnailTask struct {
	TrackId       int
	TrackDuration int
	FilePath      string
}
