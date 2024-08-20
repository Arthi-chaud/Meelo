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
// @securityDefinitions.apikey JWT
// @in header
// @name Authorization
// @description Prefix the value with `Bearer `
func main() {
	setupLogger()
	c := config.GetConfig()
	e := setupEcho(c)

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
func setupEcho(c config.Config) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	s := ScannerContext{
		config: &c,
	}

	e.GET("/", s.Status)
	e.POST("/scan", s.Scan)
	e.POST("/clean", s.Clean)
	e.POST("/refresh", s.Refresh)
	e.GET("/swagger/*", echoSwagger.WrapHandler)
	return e
}

// hangs while API is not reachable.
// after ApiHealthckechAttemptCount attempts, exits
func waitForApi(c config.Config) {
	for i := 0; i < ApiHealthckechAttemptCount; i++ {
		if err := api.HealthCheck(c); err != nil {
			glg.Fail("Failed connecting to API")
			time.Sleep(7 * time.Second)
		} else {
			glg.Success("Connected to API 🥳")
			return
		}
	}
	glg.Fatal("Could not connect to the API. Exiting...")
	os.Exit(1)
}
