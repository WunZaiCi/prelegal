#!/usr/bin/env bash
# Build the Prelegal image and run it on http://localhost:8000 (Linux).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
IMAGE="prelegal"
CONTAINER="prelegal"

echo "Building $IMAGE image..."
docker build -t "$IMAGE" "$ROOT_DIR"

# Replace any container left over from a previous run.
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

echo "Starting $CONTAINER ..."
docker run -d --name "$CONTAINER" -p 8000:8000 "$IMAGE"

echo "Prelegal is running at http://localhost:8000"
