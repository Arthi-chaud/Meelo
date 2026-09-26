#!/usr/bin/env bash

# NOTE: Partially generated using AI

set -uo pipefail

declare -A pids
declare -A commands
shutdown_requested=false

start() {
    local name="$1"
    shift

	commands["$name"]=( "$@" )

    echo "Starting $name: $*"

	"${commands[$name]}" &
    pids["$name"]=$!

    echo "$name started (PID $pid)"
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

# TODO:
# start process_a /usr/local/bin/process-a
# start process_b /usr/local/bin/process-b
# start process_c /usr/local/bin/process-c


while ! $shutdown_requested; do

    wait -n "${pids[@]}" 2>/dev/null || true

    $shutdown_requested && break

    for name in "${!pids[@]}"; do
        pid="${pids[$name]}"

        if ! kill -0 "$pid" 2>/dev/null; then
            echo "$name (PID $pid) exited; restarting..."

            wait "$pid" 2>/dev/null || true

            unset 'pids[$name]'

            # shellcheck disable=SC2086
            start "$name" ${commands[$name]}

            break
        fi
    done
done
