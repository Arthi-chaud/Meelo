FROM golang:1.24.1-alpine AS builder

RUN go install github.com/swaggo/swag/cmd/swag@latest
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY ./app ./app
COPY ./internal ./internal
RUN swag init -d app -o ./app/docs
RUN GOOS=linux go build -o ./scanner ./app

FROM golang:1.22.6-alpine AS runner
ARG VERSION=unknown

ENV SERVICE_NAME="scanner"
RUN adduser --disabled-password -s /bin/false $SERVICE_NAME

RUN apk update && apk upgrade && apk add ffmpeg chromaprint mailcap 
WORKDIR /app
COPY --from=builder /app/scanner ./
USER $SERVICE_NAME
ENV VERSION=$VERSION
CMD ["./scanner"]
