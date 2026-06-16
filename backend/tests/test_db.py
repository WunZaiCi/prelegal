"""Tests for the ephemeral SQLite foundation."""

from __future__ import annotations

from contextlib import closing

from app import db


def _table_names(conn) -> set[str]:
    rows = conn.execute(
        "SELECT name FROM sqlite_master WHERE type = 'table'"
    ).fetchall()
    return {row["name"] for row in rows}


def test_init_db_creates_users_table(tmp_path):
    db_path = tmp_path / "prelegal.db"
    init_path = db.init_db(db_path)

    assert init_path == db_path
    assert db_path.exists()

    with closing(db.connect(db_path)) as conn:
        assert "users" in _table_names(conn)


def test_users_table_has_expected_columns(tmp_path):
    db_path = tmp_path / "prelegal.db"
    db.init_db(db_path)

    with closing(db.connect(db_path)) as conn:
        cols = {row["name"] for row in conn.execute("PRAGMA table_info(users)")}

    assert {"id", "email", "password_hash", "created_at"} <= cols


def test_init_db_is_recreated_from_scratch(tmp_path):
    """Each init wipes prior data so every startup begins clean."""
    db_path = tmp_path / "prelegal.db"
    db.init_db(db_path)

    with closing(db.connect(db_path)) as conn:
        conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            ("user@example.com", "hash"),
        )
        conn.commit()
        assert conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"] == 1

    # Re-initialising drops the file and recreates an empty table.
    db.init_db(db_path)
    with closing(db.connect(db_path)) as conn:
        assert conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"] == 0
