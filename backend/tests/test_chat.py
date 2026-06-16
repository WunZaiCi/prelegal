"""Tests for the AI chat module and endpoint (LLM mocked — no network)."""

from __future__ import annotations

import litellm
import pytest
from fastapi.testclient import TestClient

from app import chat, db, main


def test_run_chat_requires_api_key(monkeypatch):
    monkeypatch.delenv("CEREBRAS_API_KEY", raising=False)
    with pytest.raises(chat.MissingApiKeyError):
        chat.run_chat([{"role": "user", "content": "hi"}])


def test_run_chat_parses_structured_output(monkeypatch):
    monkeypatch.setenv("CEREBRAS_API_KEY", "test-key")
    payload = chat.ChatResult(
        reply="Got it — which state's law should govern?",
        fields=chat.ExtractedFields(
            governingLaw="Delaware",
            party1=chat.PartyFields(company="Acme, Inc."),
        ),
    ).model_dump_json()

    # Fake the litellm response shape: response.choices[0].message.content
    class _Msg:
        content = payload

    class _Choice:
        message = _Msg()

    class _Resp:
        choices = [_Choice()]

    monkeypatch.setattr(litellm, "completion", lambda **kwargs: _Resp())

    result = chat.run_chat(
        [{"role": "user", "content": "We're Acme; use Delaware law"}],
        {"governingLaw": ""},
    )
    assert "govern" in result.reply
    assert result.fields.governingLaw == "Delaware"
    assert result.fields.party1.company == "Acme, Inc."


def test_chat_endpoint_happy_path(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DATABASE_PATH", tmp_path / "prelegal.db")

    def fake_run_chat(history, data=None):
        return chat.ChatResult(
            reply="Hello!", fields=chat.ExtractedFields(purpose="Evaluation")
        )

    monkeypatch.setattr(main, "run_chat", fake_run_chat)

    with TestClient(main.create_app()) as client:
        resp = client.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "hi"}], "data": {}},
        )

    assert resp.status_code == 200
    body = resp.json()
    assert body["reply"] == "Hello!"
    assert body["fields"]["purpose"] == "Evaluation"


def test_chat_endpoint_missing_key_returns_503(tmp_path, monkeypatch):
    monkeypatch.setattr(db, "DATABASE_PATH", tmp_path / "prelegal.db")

    def fake_run_chat(history, data=None):
        raise chat.MissingApiKeyError("no key")

    monkeypatch.setattr(main, "run_chat", fake_run_chat)

    with TestClient(main.create_app()) as client:
        resp = client.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "hi"}]},
        )

    assert resp.status_code == 503
