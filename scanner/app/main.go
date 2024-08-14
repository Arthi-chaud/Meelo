package main

import (
	_ "github.com/Arthi-chaud/Meelo/scanner/app/docs"
	"github.com/kpango/glg"
	"github.com/labstack/echo/v4"
	"github.com/swaggo/echo-swagger"
)

func setupLogger() {
	glg.Get().
		SetMode(glg.STD).
		// We will be watching the logs through docker-compose
		// It already provides timestamps
		DisableTimestamp().
		// No need to specify lines
		SetLineTraceMode(glg.TraceLineNone)
}

// @title Meelo's Scanner API
// @description The scanner is responsible for file parsing and registration.
func main() {
	setupLogger()
	e := echo.New()
	glg.Log("Hello World!")

	e.GET("/", Status)
	e.GET("/swagger/*", echoSwagger.WrapHandler)
	e.Logger.Fatal(e.Start(":8133"))
}
