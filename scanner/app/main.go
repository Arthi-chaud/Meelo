package main

import (
	"os"
	"time"

	_ "github.com/Arthi-chaud/Meelo/scanner/app/docs"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/kpango/glg"
	"github.com/labstack/echo/v4"
	"github.com/swaggo/echo-swagger"
)

const ApiHealthckechAttemptCount = 5

// @title Meelo's Scanner API
// @description The scanner is responsible for file parsing and registration.
func main() {
	setupLogger()
	c := config.GetConfig()
	e := setupEcho()

	waitForApi(c)
	e.Logger.Fatal(e.Start(":8133"))
}

func setupLogger() {
	glg.Get().
		SetMode(glg.STD).
		// We will be watching the logs through docker-compose
		// It already provides timestamps
		DisableTimestamp().
		// No need to specify lines
		SetLineTraceMode(glg.TraceLineNone)
}

// Sets up echo endpoints
func setupEcho() *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	e.GET("/", Status)
	e.GET("/swagger/*", echoSwagger.WrapHandler)
	return e
}

// hangs while API is not reachable.
// after ApiHealthckechAttemptCount attempts, exits
func waitForApi(c config.Config) {
	for i := 0; i < ApiHealthckechAttemptCount; i++ {
		if err := api.HealthCheck(c); err != nil {
			glg.Failf("Failed connecting to API: %s", err)
			time.Sleep(5 * time.Second)
		} else {
			glg.Success("Connected to API 🥳")
			return
		}
	}
	glg.Fatal("Could not connect to the API. Exiting...")
	os.Exit(1)
}
