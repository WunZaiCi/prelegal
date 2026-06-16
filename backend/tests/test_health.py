"""Tests for the JSON API surface."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app import db
from app.main import create_app


def test_health_returns_ok(tmp_path, monkeypatch):
    # Point the ephemeral DB at a temp dir so the startup hook stays isolated.
    # `init_db` reads `db.DATABASE_PATH` at call time, so patching the attribute
    # redirects the lifespan startup hook.
    monkeypatch.setattr(db, "DATABASE_PATH", tmp_path / "prelegal.db")

    with TestClient(create_app()) as client:
        resp = client.get("/api/health")

    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}
