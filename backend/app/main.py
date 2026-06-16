"""FastAPI application for the Prelegal V1 foundation.

Responsibilities:
  * Recreate the SQLite database on startup (ephemeral, fresh each run).
  * Expose a small JSON API under ``/api`` (currently just a health check).
  * Serve the statically exported frontend so the whole product runs from a
    single container on http://localhost:8000.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .config import STATIC_DIR
from .db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Recreate the database from scratch on every startup.
    init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Prelegal", version="0.1.0", lifespan=lifespan)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    # Serve the exported frontend last so it acts as a catch-all for non-API
    # routes. `html=True` makes `/` and `/login/` resolve to their index.html.
    # When the static bundle is absent (e.g. local API-only dev) we skip the
    # mount so the API still boots.
    if STATIC_DIR.is_dir():
        app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

    return app


app = create_app()
