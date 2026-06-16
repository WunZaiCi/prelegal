"""Tests for the per-user saved-documents API, incl. ownership isolation (PL-7)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import db, main


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DATABASE_PATH", tmp_path / "prelegal.db")
    with TestClient(main.create_app()) as c:
        yield c


def _register(client, email="a@example.com"):
    token = client.post(
        "/api/auth/register",
        json={"email": email, "password": "supersecret"},
    ).json()["token"]
    return {"Authorization": f"Bearer {token}"}


SAMPLE = {
    "docType": "partnership-agreement",
    "title": "Acme × Globex",
    "data": {"purpose": "Build things", "party1_company": "Acme"},
}


def test_documents_require_auth(client):
    assert client.get("/api/documents").status_code == 401
    assert client.post("/api/documents", json=SAMPLE).status_code == 401


def test_create_list_get_update_delete(client):
    h = _register(client)

    created = client.post("/api/documents", json=SAMPLE, headers=h)
    assert created.status_code == 201
    doc = created.json()
    doc_id = doc["id"]
    assert doc["data"]["purpose"] == "Build things"

    listed = client.get("/api/documents", headers=h).json()
    assert len(listed) == 1
    assert listed[0]["id"] == doc_id
    assert "data" not in listed[0]  # summaries omit the body

    fetched = client.get(f"/api/documents/{doc_id}", headers=h).json()
    assert fetched["data"]["party1_company"] == "Acme"

    updated = client.put(
        f"/api/documents/{doc_id}",
        json={"title": "Renamed", "data": {"purpose": "New"}},
        headers=h,
    )
    assert updated.status_code == 200
    assert updated.json()["title"] == "Renamed"
    assert updated.json()["data"]["purpose"] == "New"

    assert client.delete(f"/api/documents/{doc_id}", headers=h).status_code == 204
    assert client.get(f"/api/documents/{doc_id}", headers=h).status_code == 404


def test_users_cannot_access_each_others_documents(client):
    a = _register(client, "a@example.com")
    b = _register(client, "b@example.com")

    doc_id = client.post("/api/documents", json=SAMPLE, headers=a).json()["id"]

    # B sees nothing and cannot read/update/delete A's document.
    assert client.get("/api/documents", headers=b).json() == []
    assert client.get(f"/api/documents/{doc_id}", headers=b).status_code == 404
    assert (
        client.put(
            f"/api/documents/{doc_id}",
            json={"title": "x", "data": {}},
            headers=b,
        ).status_code
        == 404
    )
    assert client.delete(f"/api/documents/{doc_id}", headers=b).status_code == 404

    # A still has it intact.
    assert client.get(f"/api/documents/{doc_id}", headers=a).status_code == 200
