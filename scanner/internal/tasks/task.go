package tasks

import (
	"github.com/google/uuid"
)

type Task struct {
	Id   string
	Name string
	Exec func() error
}

type TaskInfo struct {
	Id   string
	Name string
}

func (t Task) GetInfo() TaskInfo {
	return TaskInfo{Id: t.Id, Name: t.Name}
}

func createTask(name string, exec func() error) Task {
	return Task{
		Id:   uuid.New().String(),
		Name: name,
		Exec: exec,
	}
}
