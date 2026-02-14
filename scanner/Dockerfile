FROM arthichaud/gocv-alpine AS base

FROM base AS builder
WORKDIR /app
RUN go install github.com/swaggo/swag/cmd/swag@latest
COPY go.sum go.mod ./
RUN go mod download

COPY ./app ./app
COPY ./internal ./internal
COPY ./dl_watcher.sh .
RUN sh dl_watcher.sh
RUN swag init -d app -o ./app/docs
ENV CGO_ENABLED=1
ENV CGO_CXXFLAGS=-std=c++17
ENV GOOS=linux
RUN go build -o ./scanner ./app

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
