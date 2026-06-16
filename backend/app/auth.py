"""Real registration / login, backed by the SQLite ``users`` and ``sessions``
tables (PL-7).

Password hashing and session tokens use only the Python standard library
(``hashlib.pbkdf2_hmac`` + ``secrets``) so the image needs no extra dependency.
Sessions are opaque tokens stored server-side; since the database is recreated
on every startup, all sessions are invalidated on restart (allowed by the
ticket).
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
import sqlite3

_ALGO = "pbkdf2_sha256"
_ITERATIONS = 200_000
_SALT_BYTES = 16


class AuthError(Exception):
    """Base class for authentication problems."""


class EmailTakenError(AuthError):
    """Registration attempted with an already-registered email."""


class InvalidCredentialsError(AuthError):
    """Login attempted with an unknown email or wrong password."""


# --- Password hashing -------------------------------------------------------


def hash_password(password: str) -> str:
    """Return a self-describing ``algo$iterations$salt$hash`` string."""
    salt = secrets.token_bytes(_SALT_BYTES)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt, _ITERATIONS
    )
    return "${}".format(
        "$".join(
            [
                _ALGO,
                str(_ITERATIONS),
                base64.b64encode(salt).decode(),
                base64.b64encode(digest).decode(),
            ]
        )
    )


def verify_password(password: str, stored: str) -> bool:
    """Constant-time check of ``password`` against a stored hash string."""
    try:
        _, algo, iterations, salt_b64, hash_b64 = stored.split("$")
        if algo != _ALGO:
            return False
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(hash_b64)
    except (ValueError, base64.binascii.Error):  # type: ignore[attr-defined]
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), salt, int(iterations)
    )
    return hmac.compare_digest(digest, expected)


# --- Input validation -------------------------------------------------------


def normalize_email(email: str) -> str:
    return email.strip().lower()


def valid_email(email: str) -> bool:
    # Deliberately lenient: one @, non-empty local/domain, a dot in the domain.
    parts = email.split("@")
    return (
        len(parts) == 2
        and all(parts)
        and "." in parts[1]
        and " " not in email
    )


MIN_PASSWORD_LENGTH = 8


# --- User & session operations ---------------------------------------------


def register(conn: sqlite3.Connection, email: str, password: str) -> sqlite3.Row:
    """Create a user and return the row. Raises EmailTakenError on conflict."""
    email = normalize_email(email)
    try:
        cur = conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email, hash_password(password)),
        )
        conn.commit()
    except sqlite3.IntegrityError as exc:
        raise EmailTakenError(email) from exc
    return conn.execute(
        "SELECT * FROM users WHERE id = ?", (cur.lastrowid,)
    ).fetchone()


def authenticate(
    conn: sqlite3.Connection, email: str, password: str
) -> sqlite3.Row:
    """Return the user row for valid credentials, else InvalidCredentialsError."""
    row = conn.execute(
        "SELECT * FROM users WHERE email = ?", (normalize_email(email),)
    ).fetchone()
    if row is None or not verify_password(password, row["password_hash"]):
        raise InvalidCredentialsError(email)
    return row


def create_session(conn: sqlite3.Connection, user_id: int) -> str:
    """Create and persist a new opaque session token for ``user_id``."""
    token = secrets.token_urlsafe(32)
    conn.execute(
        "INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id)
    )
    conn.commit()
    return token


def user_for_token(
    conn: sqlite3.Connection, token: str | None
) -> sqlite3.Row | None:
    """Resolve a session token to its user row, or None if invalid."""
    if not token:
        return None
    return conn.execute(
        """
        SELECT users.* FROM users
        JOIN sessions ON sessions.user_id = users.id
        WHERE sessions.token = ?
        """,
        (token,),
    ).fetchone()


def delete_session(conn: sqlite3.Connection, token: str) -> None:
    conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
