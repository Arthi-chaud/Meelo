FROM golang:1.24.1-alpine AS base
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

WORKDIR /go/pkg/mod/gocv.io/x/gocv@v0.42.0
RUN apk update && apk upgrade && apk add g++  make cmake sudo curl pkgconf g++ linux-headers
RUN make install 

FROM base AS builder
WORKDIR /app
RUN go install github.com/swaggo/swag/cmd/swag@latest
COPY ./app ./app
COPY ./internal ./internal
RUN swag init -d app -o ./app/docs
ENV CGO_ENABLED=1
RUN GOOS=linux go build -o ./scanner ./app

FROM base AS runner
ARG VERSION=unknown

ENV SERVICE_NAME="scanner"
RUN adduser --disabled-password -s /bin/false $SERVICE_NAME

RUN apk add ffmpeg chromaprint mailcap 

WORKDIR /app
COPY --from=builder /app/scanner ./
COPY ./data /app/data
USER $SERVICE_NAME
ENV VERSION=$VERSION
CMD ["./scanner"]
