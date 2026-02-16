package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/Arthi-chaud/Meelo/scanner/app/docs"
	"github.com/Arthi-chaud/Meelo/scanner/internal/api"
	"github.com/Arthi-chaud/Meelo/scanner/internal/config"
	"github.com/Arthi-chaud/Meelo/scanner/internal/tasks"
	"github.com/labstack/echo/v5"
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
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer cancel()
	s := ScannerContext{
		config: &c,
		worker: tasks.NewWorker(),
	}
	sc := echo.StartConfig{
		Address: ":8133",
	}
	e := setupEcho(&s, &sc)

	waitForApi(c)

	s.worker.StartWorker(&c)
	go WatchLibraries(&s)
	if err := sc.Start(ctx, e); err != nil {
		log.Fatal().Err(err)
	}
}

func setupLogger() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}

// Sets up echo endpoints
func setupEcho(s *ScannerContext, sc *echo.StartConfig) *echo.Echo {
	e := echo.New()

	sc.HideBanner = true
	sc.HidePort = true

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
