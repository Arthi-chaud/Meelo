package main

import (
	"net/http"
	"strings"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	t "github.com/Arthi-chaud/Meelo/scanner/internal/tasks"
	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog/log"
)

type ScannerStatus struct {
	Message string `json:"message"`
}

type ScannerTaskStatus struct {
	CurrentTask  *string  `json:"current_task"`
	PendingTasks []string `json:"pending_tasks"`
}

const TaskAddedtoQueueMessage = "Task added to queue"

func logTaskAdded(task t.Task) {
	log.Info().Str("name", task.Name).Msg(TaskAddedtoQueueMessage)
}

// @Summary		Get Status of Scanner
// @Produce		json
// @Success		200	{object}	ScannerStatus
// @Router	    / [get]
func (s *ScannerContext) Status(c echo.Context) error {
	return c.JSON(http.StatusOK, ScannerStatus{Message: "Scanner is alive."})
}

// @Summary		Get Current + Pending Tasks
// @Produce		json
// @Success		200 {object} ScannerTaskStatus
// @Router	    /tasks [get]
func (s *ScannerContext) Tasks(c echo.Context) error {
	currentTask, pendingTasks := s.worker.GetCurrentTasks()
	formattedCurentTask := &currentTask.Name
	if currentTask.Name == "" {
		formattedCurentTask = nil
	}
	formattedPendingTasks := internal.Fmap(pendingTasks, func(t t.TaskInfo, _ int) string {
		return t.Name
	})
	return c.JSON(http.StatusOK, ScannerTaskStatus{
		CurrentTask:  formattedCurentTask,
		PendingTasks: formattedPendingTasks,
	})
}

// @Summary		Request a Scan for all libraries
// @Produce		json
// @Success		202	{object}	ScannerStatus
// @Router	    /scan [post]
// @Security JWT
func (s *ScannerContext) ScanAll(c echo.Context) error {
	if !s.userIsAdmin(c) {
		return userIsNotAdminResponse(c)
	}
	libraries, err := api.GetAllLibraries(*s.config)
	if err != nil {
		return c.NoContent(http.StatusServiceUnavailable)
	}
	for _, lib := range libraries {
		task := s.worker.AddTask(t.NewLibraryScanTask(lib, *s.config))
		logTaskAdded(task)
	}
	return c.JSON(http.StatusAccepted, ScannerStatus{Message: TaskAddedtoQueueMessage})
}

// @Summary		Request a Scan for a single library
// @Produce		json
// @Success		202	{object}	ScannerStatus
// @Router	    /scan/{libraryId} [post]
// @Param		libraryId path string true "Library Slug or ID"
// @Security JWT
func (s *ScannerContext) Scan(c echo.Context) error {
	if !s.userIsAdmin(c) {
		return userIsNotAdminResponse(c)
	}
	libraryId := c.Param("libraryId")
	library, err := api.GetLibrary(*s.config, libraryId)
	if err != nil {
		return c.NoContent(http.StatusBadRequest)
	}
	task := s.worker.AddTask(t.NewLibraryScanTask(library, *s.config))
	logTaskAdded(task)
	return c.JSON(http.StatusAccepted, ScannerStatus{Message: TaskAddedtoQueueMessage})
}

// @Summary		Request a Clean
// @Produce		json
// @Success		202	{object}	ScannerStatus
// @Router	    /clean [post]
// @Security JWT
func (s *ScannerContext) Clean(c echo.Context) error {
	if !s.userIsAdmin(c) {
		return userIsNotAdminResponse(c)
	}
	libraries, err := api.GetAllLibraries(*s.config)
	if err != nil {
		return c.NoContent(http.StatusServiceUnavailable)
	}
	for _, lib := range libraries {
		task := s.worker.AddTask(t.NewLibraryCleanTask(lib, *s.config))
		logTaskAdded(task)
	}
	return c.JSON(http.StatusAccepted, ScannerStatus{Message: TaskAddedtoQueueMessage})
}

// @Summary		Request a Clean for a single library
// @Produce		json
// @Success		202	{object}	ScannerStatus
// @Router	    /clean/{libraryId} [post]
// @Param		libraryId path string true "Library Slug or ID"
// @Security JWT
func (s *ScannerContext) CleanLibrary(c echo.Context) error {
	if !s.userIsAdmin(c) {
		return userIsNotAdminResponse(c)
	}
	libraryId := c.Param("libraryId")
	library, err := api.GetLibrary(*s.config, libraryId)
	if err != nil {
		return c.NoContent(http.StatusBadRequest)
	}
	task := s.worker.AddTask(t.NewLibraryCleanTask(library, *s.config))
	logTaskAdded(task)
	return c.JSON(http.StatusAccepted, ScannerStatus{Message: TaskAddedtoQueueMessage})
}

// @Summary		Refresh Metadata of selected files
// @Description	Exactly one query parameter must be given
// @Produce		json
// @Success		202	{object}	ScannerStatus
// @Router	    /refresh [post]
// @Security JWT
// @Param			library	query		string		false	"refresh files from library"
// @Param			album	query		string		false	"refresh files from album"
// @Param			release	query		string		false	"refresh files from release"
// @Param			song	query		string		false	"refresh files from song"
// @Param			track	query		string		false	"refresh file from track"
func (s *ScannerContext) Refresh(c echo.Context) error {
	if !s.userIsAdmin(c) {
		return userIsNotAdminResponse(c)
	}
	library := c.QueryParam("library")
	album := c.QueryParam("album")
	release := c.QueryParam("release")
	song := c.QueryParam("song")
	track := c.QueryParam("track")
	params := internal.Filter([]string{library, album, release, song, track}, func(p string) bool {
		return len(p) > 0
	})
	if len(params) != 1 {
		return c.JSON(http.StatusBadRequest, ScannerStatus{Message: "Expected exactly one query parameter"})
	}
	task := s.worker.AddTask(t.NewMetadataRefreshTask(api.FileSelectorDto{
		Library: library,
		Album:   album,
		Release: release,
		Song:    song,
		Track:   track,
	}, *s.config))
	logTaskAdded(task)
	return c.JSON(http.StatusAccepted, ScannerStatus{Message: TaskAddedtoQueueMessage})
}

// Checks that the requesting user
func (s *ScannerContext) userIsAdmin(c echo.Context) bool {
	userToken := getUserToken(c)
	if userToken == "" {
		return false
	}
	user, err := api.GetUserFromAccessToken(*s.config, userToken)
	if err != nil {
		log.Error().Msg(err.Error())
		return false
	}
	return user.Admin
}

func userIsNotAdminResponse(c echo.Context) error {
	return c.JSON(http.StatusUnauthorized, ScannerStatus{Message: "User must be admin to run tasks."})
}

func getUserToken(c echo.Context) string {
	jwts := c.Request().Header["Authorization"]
	if len(jwts) == 0 {
		return ""
	}
	jwt := strings.TrimSpace(strings.Replace(jwts[0], "Bearer ", "", 1))
	return jwt
}
