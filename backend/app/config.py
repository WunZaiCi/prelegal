"""Runtime configuration resolved from environment variables.

Keeping this in one place lets the Docker image, the local dev scripts, and the
test suite each point the app at different locations without touching code.
"""

from __future__ import annotations

import os
from pathlib import Path

# Repository / image layout:
#   backend/app/config.py  -> BACKEND_DIR = backend/
BACKEND_DIR = Path(__file__).resolve().parent.parent


def _path_from_env(var: str, default: Path) -> Path:
    value = os.environ.get(var)
    return Path(value).resolve() if value else default


# SQLite database file. Recreated from scratch on every startup, so it lives in
# a disposable location by default.
DATABASE_PATH = _path_from_env("PRELEGAL_DB_PATH", BACKEND_DIR / "prelegal.db")

# Directory holding the statically exported frontend (Next.js `out/`). In the
# Docker image the build copies it next to the backend; locally it may be absent
# (run the frontend with `next dev` instead), which the app tolerates.
STATIC_DIR = _path_from_env("PRELEGAL_STATIC_DIR", BACKEND_DIR / "static")
