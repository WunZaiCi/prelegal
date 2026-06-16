"""SQLite foundation for the product.

The database is intentionally *ephemeral*: it is recreated from scratch every
time the app starts (and therefore every time the Docker container starts), as
required by the project's technical design. PL-7 adds real registration/login
(``users`` + ``sessions``) and per-user saved drafts (``documents``); because
the database resets on restart, sessions and saved documents do not survive a
server restart — which the ticket explicitly allows.
"""

from __future__ import annotations

import sqlite3
from contextlib import closing
from pathlib import Path

from .config import DATABASE_PATH

# Schema. Password hashes (never plaintext) live in `users`; opaque session
# tokens in `sessions`; per-user saved drafts in `documents` (the editor state
# is stored as a JSON string in `data`). Child rows cascade-delete with users.
SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS documents (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doc_type   TEXT    NOT NULL,
    title      TEXT    NOT NULL,
    data       TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
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
