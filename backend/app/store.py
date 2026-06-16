"""Per-user saved drafts (PL-7).

Documents store the editor state (``data``) as a JSON string alongside the
document type and a human title. All queries are scoped by ``user_id`` so one
user can never read or modify another's drafts.
"""

from __future__ import annotations

import json
import sqlite3
from typing import Any


def create_document(
    conn: sqlite3.Connection,
    user_id: int,
    doc_type: str,
    title: str,
    data: Any,
) -> sqlite3.Row:
    cur = conn.execute(
        "INSERT INTO documents (user_id, doc_type, title, data) "
        "VALUES (?, ?, ?, ?)",
        (user_id, doc_type, title, json.dumps(data, ensure_ascii=False)),
    )
    conn.commit()
    return get_document(conn, user_id, cur.lastrowid)  # type: ignore[arg-type]


def list_documents(conn: sqlite3.Connection, user_id: int) -> list[sqlite3.Row]:
    """Summaries (no ``data``) for a user, most-recently-updated first."""
    return conn.execute(
        "SELECT id, doc_type, title, created_at, updated_at "
        "FROM documents WHERE user_id = ? ORDER BY updated_at DESC, id DESC",
        (user_id,),
    ).fetchall()


def get_document(
    conn: sqlite3.Connection, user_id: int, doc_id: int
) -> sqlite3.Row | None:
    return conn.execute(
        "SELECT * FROM documents WHERE id = ? AND user_id = ?",
        (doc_id, user_id),
    ).fetchone()


def update_document(
    conn: sqlite3.Connection,
    user_id: int,
    doc_id: int,
    title: str,
    data: Any,
) -> sqlite3.Row | None:
    """Update a user's document; returns the updated row or None if not found."""
    cur = conn.execute(
        "UPDATE documents SET title = ?, data = ?, updated_at = datetime('now') "
        "WHERE id = ? AND user_id = ?",
        (title, json.dumps(data, ensure_ascii=False), doc_id, user_id),
    )
    conn.commit()
    if cur.rowcount == 0:
        return None
    return get_document(conn, user_id, doc_id)


def delete_document(conn: sqlite3.Connection, user_id: int, doc_id: int) -> bool:
    cur = conn.execute(
        "DELETE FROM documents WHERE id = ? AND user_id = ?", (doc_id, user_id)
    )
    conn.commit()
    return cur.rowcount > 0


def row_to_summary(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "docType": row["doc_type"],
        "title": row["title"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


def row_to_document(row: sqlite3.Row) -> dict:
    return {**row_to_summary(row), "data": json.loads(row["data"])}
