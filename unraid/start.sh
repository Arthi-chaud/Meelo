#!/usr/bin/env bash

# NOTE: Partially generated using AI

set -uo pipefail

declare -A pids
declare -A commands
declare -A wds
shutdown_requested=false

run_migrations() {
	export DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/meelo?schema=public
	yarn --cwd /app/server run prisma migrate deploy  || exit 1
}

start() {
    local name="$1"
    shift

	local pwd="$1"
	shift

	commands["$name"]="$*"

	echo "Starting $name ($pwd): $*"

	cd "$pwd" ; $@ &
	cd
    pids["$name"]=$!
    wds["$name"]="$pwd"

    echo "$name started (PID ${pids[$name]})"
}

stop_all() {
    shutdown_requested=true

    echo "Stopping processes..."

    for name in "${!pids[@]}"; do
        pid="${pids[$name]}"

        if kill -0 "$pid" 2>/dev/null; then
            echo "Sending SIGTERM to $name (PID $pid)"
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done

    # Give processes a chance to shut down gracefully.
    for name in "${!pids[@]}"; do
        pid="${pids[$name]}"
        wait "$pid" 2>/dev/null || true
    done

    echo "Shutdown complete."
    exit 0
}

trap stop_all SIGTERM SIGINT

declare -A commands

start psql "/" "postgres -D $PGDATA"
start meilisearch "/" "meilisearch --db-path /app/meilisearch/db --dump-dir /app/meilisearch/dump --no-analytics"
export RABBITMQ_DEFAULT_USER=${RABBITMQ_USER}
export RABBITMQ_DEFAULT_PASS=${RABBITMQ_PASSWORD}
start mq "/" "rabbitmq-server"
run_migrations
export MEILI_HOST=http://localhost:7700
export RABBITMQ_URL=amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@localhost:5672
start server "/app/server" "yarn start:prod"
export API_URL=http://localhost:4000
sleep 3 ; start scanner "/app/scanner" "./scanner"
start matcher "/app/matcher" "fastapi run matcher --port 6789"
export HOSTNAME="0.0.0.0"
start front "/app/front" "node server.js"


while ! $shutdown_requested; do

    wait -n "${pids[@]}" 2>/dev/null || true

    $shutdown_requested && break

    for name in "${!pids[@]}"; do
        pid="${pids[$name]}"
        cwd="${wds[$name]}"

        if ! kill -0 "$pid" 2>/dev/null; then
            echo "$name (PID $pid) exited; restarting..."

            wait "$pid" 2>/dev/null || true

            unset 'pids[$name]'

            # shellcheck disable=SC2086
            start "$name" "$cwd" ${commands[$name]}

            break
        fi
    done
done
