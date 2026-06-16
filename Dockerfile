# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 — build the frontend into a static export (`frontend/out`).
# ---------------------------------------------------------------------------
FROM node:20-slim AS frontend
WORKDIR /frontend

# Install dependencies first for better layer caching.
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Build the static site.
COPY frontend/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 — FastAPI backend that serves the API and the exported frontend.
# ---------------------------------------------------------------------------
FROM python:3.12-slim AS runtime

# uv for dependency management (matches the backend's uv project).
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Install backend dependencies from the lockfile (no dev group in the image).
ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never
COPY backend/pyproject.toml backend/uv.lock backend/.python-version ./
RUN uv sync --frozen --no-dev --no-install-project

# Application code.
COPY backend/app ./app

# Static frontend produced by stage 1.
COPY --from=frontend /frontend/out ./static

# The ephemeral SQLite DB is recreated on every startup; keep it off the
# read-mostly app tree.
ENV PRELEGAL_STATIC_DIR=/app/static \
    PRELEGAL_DB_PATH=/tmp/prelegal.db \
    PATH="/app/.venv/bin:$PATH"

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
