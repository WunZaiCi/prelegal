"""SQLite foundation for the V1 product.

The database is intentionally *ephemeral*: it is recreated from scratch every
time the app starts (and therefore every time the Docker container starts), as
required by the project's technical design. V1 ships with a fake, frontend-only
login, so no endpoints read or write the ``users`` table yet — it exists as
scaffolding so real registration/login can be added later without a migration.
"""

from __future__ import annotations

import sqlite3
from contextlib import closing
from pathlib import Path

from .config import DATABASE_PATH

# Schema for the foundational `users` table. Password hashes are stored (rather
# than plaintext) so the column is ready for real authentication later.
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);
"""


def connect(db_path: Path | None = None) -> sqlite3.Connection:
    """Open a SQLite connection with sensible defaults.

    Note: ``sqlite3.Connection`` used as a context manager commits/rolls back but
    does **not** close the handle. Wrap calls in ``contextlib.closing`` (or close
    explicitly) so the file is released — important on Windows, where an open
    handle blocks deleting/recreating the database file.
    """
    path = db_path or DATABASE_PATH
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(db_path: Path | None = None) -> Path:
    """Create a fresh database, dropping any existing file first.

    Returns the path of the database that was (re)created so callers/tests can
    assert against it.
    """
    path = db_path or DATABASE_PATH
    path.parent.mkdir(parents=True, exist_ok=True)
    # Recreate from scratch: drop the previous file so each start is clean.
    path.unlink(missing_ok=True)

    with closing(connect(path)) as conn:
        conn.executescript(SCHEMA)
        conn.commit()
    return path
