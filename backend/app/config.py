"""Runtime configuration resolved from environment variables.

Keeping this in one place lets the Docker image, the local dev scripts, and the
test suite each point the app at different locations without touching code.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

# Repository / image layout:
#   backend/app/config.py  -> BACKEND_DIR = backend/
BACKEND_DIR = Path(__file__).resolve().parent.parent

# Load the repo-root .env (one level above backend/) for local dev so secrets
# like CEREBRAS_API_KEY reach the process. In Docker the file is absent (it is
# gitignored and excluded from the image); the key is passed via --env-file at
# `docker run`, so this is simply a no-op there. Never override real env vars.
load_dotenv(BACKEND_DIR.parent / ".env", override=False)


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

# Shared document-type registry (PL-6). The single source of truth lives in the
# frontend (`frontend/lib/documents.json`); locally we read it straight from the
# repo, and the Docker image copies it next to the app and sets the env var.
DOCUMENTS_PATH = _path_from_env(
    "PRELEGAL_DOCUMENTS_PATH",
    BACKEND_DIR.parent / "frontend" / "lib" / "documents.json",
)
