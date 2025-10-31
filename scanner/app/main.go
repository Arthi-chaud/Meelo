package main

import (
	"os"
	"time"

	_ "github.com/Arthi-chaud/Meelo/scanner/app/docs"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/tasks"
	"github.com/Arthi-chaud/Meelo/scanner/internal/watcher"
	"github.com/labstack/echo/v4"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
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
	go watcher.WatchLibraries(c)
	e.Logger.Fatal(e.Start(":8133"))
}

func setupLogger() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}

// Sets up echo endpoints
func setupEcho(c config.Config) *echo.Echo {
	e := echo.New()
	e.HideBanner = true
	e.HidePort = true

	s := ScannerContext{
		config: &c,
		worker: tasks.NewWorker(),
	}
	s.worker.StartWorker(c)

	e.GET("/", s.Status)
	e.GET("/tasks", s.Tasks)
	e.POST("/scan", s.ScanAll)
	e.POST("/scan/:libraryId", s.Scan)
	e.POST("/clean", s.Clean)
	e.POST("/clean/:libraryId", s.CleanLibrary)
	e.POST("/refresh", s.Refresh)
	e.GET("/swagger/*", echoSwagger.WrapHandler)
	return e
}

// hangs while API is not reachable.
// after ApiHealthckechAttemptCount attempts, exits
func waitForApi(c config.Config) {
	for i := 0; i < ApiHealthckechAttemptCount; i++ {
		if err := api.HealthCheck(c); err != nil {
			log.Error().Msg("Failed connecting to API")
			time.Sleep(7 * time.Second)
		} else {
			log.Info().Msg("Connected to API 🥳")
			return
		}
	}
	log.Fatal().Msg("Could not connect to the API. Exiting...")
	os.Exit(1)
}
