"""Tests for serving the exported frontend from FastAPI."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app import config, db
from app import main


def test_static_index_is_served_when_present(tmp_path, monkeypatch):
    static_dir = tmp_path / "static"
    static_dir.mkdir()
    (static_dir / "index.html").write_text("<h1>Prelegal</h1>", encoding="utf-8")

    monkeypatch.setattr(db, "DATABASE_PATH", tmp_path / "prelegal.db")
    # `create_app` reads `STATIC_DIR` from the `main` module namespace.
    monkeypatch.setattr(main, "STATIC_DIR", static_dir)

    with TestClient(main.create_app()) as client:
        resp = client.get("/")

    assert resp.status_code == 200
    assert "Prelegal" in resp.text


def test_api_still_works_without_static_bundle(tmp_path, monkeypatch):
    """API-only mode (no exported frontend) should still boot and serve /api."""
    monkeypatch.setattr(db, "DATABASE_PATH", tmp_path / "prelegal.db")
    monkeypatch.setattr(main, "STATIC_DIR", tmp_path / "does-not-exist")

    with TestClient(main.create_app()) as client:
        assert client.get("/api/health").status_code == 200
