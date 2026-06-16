#!/usr/bin/env bash
# Build the Prelegal image and run it on http://localhost:8000 (macOS).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
IMAGE="prelegal"
CONTAINER="prelegal"

echo "Building $IMAGE image..."
# On slow/blocked networks, set NPM_REGISTRY (e.g. https://registry.npmmirror.com)
# to build the frontend against a mirror.
BUILD_ARGS=()
if [ -n "${NPM_REGISTRY:-}" ]; then
  echo "Using npm registry: $NPM_REGISTRY"
  BUILD_ARGS+=(--build-arg "NPM_REGISTRY=$NPM_REGISTRY")
fi
docker build ${BUILD_ARGS[@]+"${BUILD_ARGS[@]}"} -t "$IMAGE" "$ROOT_DIR"

# Replace any container left over from a previous run.
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true

echo "Starting $CONTAINER ..."
# Pass secrets (e.g. CEREBRAS_API_KEY) from .env into the container at runtime.
# The file is gitignored and never baked into the image.
RUN_ARGS=(-d --name "$CONTAINER" -p 8000:8000)
if [ -f "$ROOT_DIR/.env" ]; then
  echo "Loading secrets from .env"
  RUN_ARGS+=(--env-file "$ROOT_DIR/.env")
else
  echo "No .env found - AI chat will be disabled (set CEREBRAS_API_KEY in .env)."
fi
docker run "${RUN_ARGS[@]}" "$IMAGE"

echo "Prelegal is running at http://localhost:8000"
