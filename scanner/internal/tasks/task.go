package tasks

import (
	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/google/uuid"
)

type TaskType int

const (
	Scan    = 0
	Clean   = 1
	Refresh = 2
)

func (t TaskType) String() string {
	switch t {
	case Scan:
		return "Scan"
	case Clean:
		return "Clean"
	case Refresh:
		return "Refresh"
	default:
		return "Unknown"
	}

}

type Task struct {
	Id        string
	Name      string
	LibraryId int
	Type      TaskType
	Exec      func(w *Worker) error
}

type TaskInfo struct {
	Id   string
	Name string
}

func (t Task) GetInfo() TaskInfo {
	return TaskInfo{Id: t.Id, Name: t.Name}
}

func createTask(libraryId int, taskType TaskType, name string, exec func(w *Worker) error) Task {
	return Task{
		Id:        uuid.New().String(),
		Name:      name,
		Exec:      exec,
		LibraryId: libraryId,
		Type:      taskType,
	}
}

func (t Task) IsEquivalent(t1 Task) bool {
	if t.Type == Refresh && t1.Type == Refresh {
		return t.Name == t1.Name
	}
	return t.LibraryId == t1.LibraryId && t.Type == t1.Type
}

type ThumbnailTask struct {
	TrackId       int
	TrackDuration int
	FilePath      string
}

type IllustrationTask struct {
	IllustrationLocation    internal.IllustrationLocation
	IllustrationPath        string
	TrackPath               string
	TrackId                 int
	IllustrationStreamIndex int
}
