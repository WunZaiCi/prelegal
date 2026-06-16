"""FastAPI application for Prelegal.

Responsibilities:
  * Recreate the SQLite database on startup (ephemeral, fresh each run).
  * Expose the JSON API under ``/api``: health, AI chat, real auth
    (register/login/logout/me), and per-user saved documents.
  * Serve the statically exported frontend so the whole product runs from a
    single container on http://localhost:8000.
"""

from __future__ import annotations

import sqlite3
from contextlib import asynccontextmanager
from typing import Any

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import auth, db, store
from .chat import ChatResult, MissingApiKeyError, run_chat
from .config import STATIC_DIR


# --- Request / response models ----------------------------------------------


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    data: dict | None = None
    docType: str | None = None


class Credentials(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str


class AuthOut(BaseModel):
    token: str
    user: UserOut


class DocumentIn(BaseModel):
    docType: str
    title: str
    data: Any


class DocumentUpdateIn(BaseModel):
    title: str
    data: Any


# --- Dependencies -----------------------------------------------------------


def get_conn():
    """One SQLite connection per request (cached across dependencies)."""
    conn = db.connect()
    try:
        yield conn
    finally:
        conn.close()


def get_token(authorization: str | None = Header(default=None)) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return None


def current_user(
    token: str | None = Depends(get_token),
    conn: sqlite3.Connection = Depends(get_conn),
) -> sqlite3.Row:
    user = auth.user_for_token(conn, token)
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Recreate the database from scratch on every startup.
    db.init_db()
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Prelegal", version="0.2.0", lifespan=lifespan)

    @app.get("/api/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    # --- AI chat ------------------------------------------------------------

    @app.post("/api/chat", response_model=ChatResult)
    def chat(req: ChatRequest) -> ChatResult:
        history = [m.model_dump() for m in req.messages]
        try:
            return run_chat(history, req.data, req.docType)
        except MissingApiKeyError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except Exception as exc:  # noqa: BLE001 — surface a clean error to the UI
            raise HTTPException(
                status_code=502, detail=f"AI request failed: {exc}"
            ) from exc

    # --- Auth ---------------------------------------------------------------

    @app.post("/api/auth/register", response_model=AuthOut, status_code=201)
    def register(creds: Credentials, conn=Depends(get_conn)) -> AuthOut:
        email = auth.normalize_email(creds.email)
        if not auth.valid_email(email):
            raise HTTPException(status_code=422, detail="Enter a valid email.")
        if len(creds.password) < auth.MIN_PASSWORD_LENGTH:
            raise HTTPException(
                status_code=422,
                detail=f"Password must be at least {auth.MIN_PASSWORD_LENGTH} characters.",
            )
        try:
            user = auth.register(conn, email, creds.password)
        except auth.EmailTakenError as exc:
            raise HTTPException(
                status_code=409, detail="That email is already registered."
            ) from exc
        token = auth.create_session(conn, user["id"])
        return AuthOut(token=token, user=UserOut(id=user["id"], email=user["email"]))

    @app.post("/api/auth/login", response_model=AuthOut)
    def login(creds: Credentials, conn=Depends(get_conn)) -> AuthOut:
        try:
            user = auth.authenticate(conn, creds.email, creds.password)
        except auth.InvalidCredentialsError as exc:
            raise HTTPException(
                status_code=401, detail="Incorrect email or password."
            ) from exc
        token = auth.create_session(conn, user["id"])
        return AuthOut(token=token, user=UserOut(id=user["id"], email=user["email"]))

    @app.post("/api/auth/logout", status_code=204)
    def logout(
        token: str | None = Depends(get_token),
        _user=Depends(current_user),
        conn=Depends(get_conn),
    ) -> None:
        if token:
            auth.delete_session(conn, token)

    @app.get("/api/auth/me", response_model=UserOut)
    def me(user=Depends(current_user)) -> UserOut:
        return UserOut(id=user["id"], email=user["email"])

    # --- Saved documents ----------------------------------------------------

    @app.get("/api/documents")
    def list_documents(user=Depends(current_user), conn=Depends(get_conn)) -> list[dict]:
        return [store.row_to_summary(r) for r in store.list_documents(conn, user["id"])]

    @app.post("/api/documents", status_code=201)
    def create_document(
        body: DocumentIn, user=Depends(current_user), conn=Depends(get_conn)
    ) -> dict:
        row = store.create_document(
            conn, user["id"], body.docType, body.title, body.data
        )
        return store.row_to_document(row)

    @app.get("/api/documents/{doc_id}")
    def get_document(
        doc_id: int, user=Depends(current_user), conn=Depends(get_conn)
    ) -> dict:
        row = store.get_document(conn, user["id"], doc_id)
        if row is None:
            raise HTTPException(status_code=404, detail="Document not found.")
        return store.row_to_document(row)

    @app.put("/api/documents/{doc_id}")
    def update_document(
        doc_id: int,
        body: DocumentUpdateIn,
        user=Depends(current_user),
        conn=Depends(get_conn),
    ) -> dict:
        row = store.update_document(
            conn, user["id"], doc_id, body.title, body.data
        )
        if row is None:
            raise HTTPException(status_code=404, detail="Document not found.")
        return store.row_to_document(row)

    @app.delete("/api/documents/{doc_id}", status_code=204)
    def delete_document(
        doc_id: int, user=Depends(current_user), conn=Depends(get_conn)
    ) -> None:
        if not store.delete_document(conn, user["id"], doc_id):
            raise HTTPException(status_code=404, detail="Document not found.")

    # Serve the exported frontend last so it acts as a catch-all for non-API
    # routes. `html=True` makes `/` and `/login/` resolve to their index.html.
    # When the static bundle is absent (e.g. local API-only dev) we skip the
    # mount so the API still boots.
    if STATIC_DIR.is_dir():
        app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

    return app


app = create_app()
