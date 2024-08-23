package main

import (
	"net/http"
	"strings"

	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/tasks"
	"github.com/kpango/glg"
	"github.com/labstack/echo/v4"
)

type ScannerStatus struct {
	Message string `json:"message"`
}

const TaskAddedtoQueueMessage = "Task added to queue."

// @Summary		Get Status of Scanner
// @Produce		json
// @Success		200	{object}	ScannerStatus
// @Router	    / [get]
func (s *ScannerContext) Status(c echo.Context) error {
	return c.JSON(http.StatusOK, ScannerStatus{Message: "Scanner is alive."})
}

// @Summary		Get Pending Tasks
// @Produce		json
// @Success		200 {array} string
// @Router	    /tasks [get]
func (s *ScannerContext) Tasks(c echo.Context) error {
	return c.JSON(http.StatusOK, s.getTasks())
}

// @Summary		Request a Scan
// @Produce		json
// @Success		202	{object}	ScannerStatus
// @Router	    /scan [post]
// @Security JWT
func (s *ScannerContext) Scan(c echo.Context) error {
	if !s.userIsAdmin(c) {
		return userIsNotAdminResponse(c)
	}
	libraries, err := api.GetAllLibraries(*s.config)
	if err != nil {
		c.NoContent(http.StatusServiceUnavailable)
	}
	for _, lib := range libraries {
		s.pushTaskToQueue(tasks.LibraryScan{LibrarySlug: lib.Slug})
	}
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
