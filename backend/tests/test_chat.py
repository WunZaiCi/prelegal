"""Tests for the AI chat module and endpoint (LLM mocked — no network)."""

from __future__ import annotations

import json

import litellm
import pytest
from fastapi.testclient import TestClient

from app import chat, db, main


def _mock_completion(monkeypatch, payload: str):
    """Make litellm.completion return a fixed JSON content payload."""

    class _Msg:
        content = payload

    class _Choice:
        message = _Msg()

    class _Resp:
        choices = [_Choice()]

    monkeypatch.setattr(litellm, "completion", lambda **kwargs: _Resp())


def test_run_chat_requires_api_key(monkeypatch):
    monkeypatch.delenv("CEREBRAS_API_KEY", raising=False)
    with pytest.raises(chat.MissingApiKeyError):
        chat.run_chat([{"role": "user", "content": "hi"}])


def test_selection_mode_sets_doctype(monkeypatch):
    monkeypatch.setenv("CEREBRAS_API_KEY", "test-key")
    _mock_completion(
        monkeypatch,
        json.dumps({"reply": "Sounds like an NDA.", "docType": "mutual-nda"}),
    )

    result = chat.run_chat([{"role": "user", "content": "I need an NDA"}])
    assert result.docType == "mutual-nda"
    assert result.ndaFields is None and result.fields is None


def test_nda_mode_parses_structured_output(monkeypatch):
    monkeypatch.setenv("CEREBRAS_API_KEY", "test-key")
    _mock_completion(
        monkeypatch,
        json.dumps(
            {
                "reply": "Got it — which state's law should govern?",
                "fields": {
                    "governingLaw": "Delaware",
                    "party1": {"company": "Acme, Inc."},
                },
            }
        ),
    )

    result = chat.run_chat(
        [{"role": "user", "content": "We're Acme; use Delaware law"}],
        {"governingLaw": ""},
        "mutual-nda",
    )
    assert "govern" in result.reply
    assert result.docType == "mutual-nda"
    assert result.ndaFields.governingLaw == "Delaware"
    assert result.ndaFields.party1.company == "Acme, Inc."


def test_generic_mode_extracts_known_keys(monkeypatch):
    monkeypatch.setenv("CEREBRAS_API_KEY", "test-key")
    _mock_completion(
        monkeypatch,
        json.dumps(
            {
                "reply": "Noted the purpose and Partner 1.",
                "fields": {
                    "purpose": "Build a joint product",
                    "party1_company": "Acme, Inc.",
                },
            }
        ),
    )

    result = chat.run_chat(
        [{"role": "user", "content": "partnership to build a product"}],
        {},
        "partnership-agreement",
    )
    assert result.docType == "partnership-agreement"
    assert result.ndaFields is None
    assert result.fields["purpose"] == "Build a joint product"
    assert result.fields["party1_company"] == "Acme, Inc."


def test_chat_endpoint_happy_path(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DATABASE_PATH", tmp_path / "prelegal.db")

    def fake_run_chat(history, data=None, doc_type=None):
        return chat.ChatResult(
            reply="Hello!", docType="mutual-nda", fields={"purpose": "Evaluation"}
        )

    monkeypatch.setattr(main, "run_chat", fake_run_chat)

    with TestClient(main.create_app()) as client:
        resp = client.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "hi"}],
                "data": {},
                "docType": "mutual-nda",
            },
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["reply"] == "Hello!"
    assert body["docType"] == "mutual-nda"
    assert body["fields"]["purpose"] == "Evaluation"


def test_chat_endpoint_missing_key_returns_503(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DATABASE_PATH", tmp_path / "prelegal.db")

    def fake_run_chat(history, data=None, doc_type=None):
        raise chat.MissingApiKeyError("no key")

    monkeypatch.setattr(main, "run_chat", fake_run_chat)

    with TestClient(main.create_app()) as client:
        resp = client.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "hi"}]},
        )

    assert resp.status_code == 503
