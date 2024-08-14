FROM golang:1.22.6-bullseye as builder
RUN go install github.com/swaggo/swag/cmd/swag@latest
RUN apt-get update -y; apt-get install -y ffmpeg
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY ./app ./app
COPY ./internal ./internal
RUN swag init -d app -o ./app/docs
RUN GOOS=linux go build -o ./scanner ./app

FROM debian:bullseye-slim as runner
RUN apt-get update -y; apt-get install -y ffmpeg
WORKDIR /app
COPY --from=builder /app/scanner ./
CMD ./scanner