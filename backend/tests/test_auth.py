"""Tests for real registration/login and session handling (PL-7)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import auth, db, main


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DATABASE_PATH", tmp_path / "prelegal.db")
    with TestClient(main.create_app()) as c:
        yield c


# --- Unit: hashing / validation ---------------------------------------------


def test_password_hash_roundtrip():
    stored = auth.hash_password("correct horse")
    assert stored != "correct horse"  # not plaintext
    assert auth.verify_password("correct horse", stored)
    assert not auth.verify_password("wrong", stored)


def test_verify_password_rejects_garbage():
    assert not auth.verify_password("x", "not-a-valid-hash")


def test_valid_email():
    assert auth.valid_email("a@b.com")
    assert not auth.valid_email("nope")
    assert not auth.valid_email("a@b")
    assert not auth.valid_email("a b@c.com")


# --- API: registration ------------------------------------------------------


def test_register_returns_token_and_normalizes_email(client):
    resp = client.post(
        "/api/auth/register",
        json={"email": "  Jane@Example.COM ", "password": "supersecret"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["token"]
    assert body["user"]["email"] == "jane@example.com"


def test_register_duplicate_email_conflicts(client):
    payload = {"email": "dup@example.com", "password": "supersecret"}
    assert client.post("/api/auth/register", json=payload).status_code == 201
    resp = client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


def test_register_validates_email_and_password(client):
    bad_email = client.post(
        "/api/auth/register", json={"email": "nope", "password": "supersecret"}
    )
    assert bad_email.status_code == 422

    short_pw = client.post(
        "/api/auth/register", json={"email": "a@b.com", "password": "short"}
    )
    assert short_pw.status_code == 422


# --- API: login / me / logout ----------------------------------------------


def test_login_success_and_failure(client):
    client.post(
        "/api/auth/register",
        json={"email": "user@example.com", "password": "supersecret"},
    )

    ok = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "supersecret"},
    )
    assert ok.status_code == 200
    assert ok.json()["token"]

    wrong_pw = client.post(
        "/api/auth/login",
        json={"email": "user@example.com", "password": "nope"},
    )
    assert wrong_pw.status_code == 401

    unknown = client.post(
        "/api/auth/login",
        json={"email": "ghost@example.com", "password": "supersecret"},
    )
    assert unknown.status_code == 401


def test_me_requires_valid_token(client):
    token = client.post(
        "/api/auth/register",
        json={"email": "me@example.com", "password": "supersecret"},
    ).json()["token"]

    assert client.get("/api/auth/me").status_code == 401
    assert (
        client.get(
            "/api/auth/me", headers={"Authorization": "Bearer nonsense"}
        ).status_code
        == 401
    )

    ok = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert ok.status_code == 200
    assert ok.json()["email"] == "me@example.com"


def test_logout_invalidates_session(client):
    token = client.post(
        "/api/auth/register",
        json={"email": "bye@example.com", "password": "supersecret"},
    ).json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    assert client.post("/api/auth/logout", headers=headers).status_code == 204
    # Token no longer works.
    assert client.get("/api/auth/me", headers=headers).status_code == 401
