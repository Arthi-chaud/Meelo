package main

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type ScannerStatus struct {
	Message string      `json:"message"`
}

// @Summary		Get Status of Scanner
// @Produce		json
// @Success		200	{object}	ScannerStatus
// @Router	    / [get]
func Status(c echo.Context) error {
	return c.JSON(http.StatusOK, ScannerStatus{Message: "Scanner is alive."})
}