package main

import (
	"net/http"
	"strings"

	"github.com/Arthi-chaud/Meelo/scanner/internal"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	t "github.com/Arthi-chaud/Meelo/scanner/internal/tasks"
	"github.com/kpango/glg"
	"github.com/labstack/echo/v4"
)

type ScannerStatus struct {
	Message string `json:"message"`
}

type ScannerTaskStatus struct {
	CurrentTask  *string  `json:"current_task"`
	PendingTasks []string `json:"pending_tasks"`
}

const TaskAddedtoQueueMessage = "Task added to queue."

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
		glg.Logf("Task added to queue: %s", task.Name)
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
	glg.Logf("Task added to queue: %s", task.Name)
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
		glg.Logf("Task added to queue: %s", task.Name)
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
	glg.Logf("Task added to queue: %s", task.Name)
	return c.JSON(http.StatusAccepted, ScannerStatus{Message: TaskAddedtoQueueMessage})
}

// @Summary		Refresh Metadata
// @Produce		json
// @Success		202	{object}	ScannerStatus
// @Router	    /refresh [post]
// @Security JWT
func (s *ScannerContext) Refresh(c echo.Context) error {
	if !s.userIsAdmin(c) {
		return userIsNotAdminResponse(c)
	}
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
		glg.Fail(err)
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
