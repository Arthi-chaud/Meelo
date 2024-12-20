FROM golang:1.22.6-bullseye AS builder
RUN go install github.com/swaggo/swag/cmd/swag@latest
RUN apt-get update -y; apt-get install -y ffmpeg libchromaprint-tools libchromaprint-dev libfftw3-dev
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY ./app ./app
COPY ./internal ./internal
RUN swag init -d app -o ./app/docs
RUN GOOS=linux go build -o ./scanner ./app

FROM debian:bullseye-slim AS runner

ENV SERVICE_NAME="scanner"
RUN useradd -ms /bin/false $SERVICE_NAME

RUN apt-get update -y; apt-get install -y ffmpeg wget
WORKDIR /app
COPY --from=builder /app/scanner ./
USER $SERVICE_NAME
CMD ["./scanner"]