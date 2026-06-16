"""AI chat that picks a document type and fills it in by conversation (PL-6).

Each turn runs a single LLM call in one of three modes, chosen by the document
the frontend is currently working on:

  * **selection** (no document yet): the assistant helps the user pick one of the
    supported documents. For an unsupported request it recommends the closest
    supported document and, once the user agrees, sets ``docType``.
  * **nda**: the bespoke Mutual NDA flow — fills the structured ``ExtractedFields``
    (unchanged from PL-5).
  * **generic**: any other catalogue document — fills that document's key terms,
    extracted against a schema derived from ``documents.json``.

LLM access uses LiteLLM with Cerebras as the inference provider — model
``cerebras/gpt-oss-120b`` — using structured outputs. The credential is read
from ``CEREBRAS_API_KEY`` (see the repo-root ``.env``).
"""

from __future__ import annotations

import json
import os
from typing import Literal, Optional

from pydantic import BaseModel, create_model

from .documents import (
    generic_fields_model,
    generic_fields_prompt,
    get_document,
    selection_catalogue,
)

MODEL = "cerebras/gpt-oss-120b"
API_KEY_ENV = "CEREBRAS_API_KEY"


class MissingApiKeyError(RuntimeError):
    """Raised when the Cerebras API key is not configured."""


# --- NDA structured output (unchanged from PL-5) ----------------------------
# Field names mirror the frontend `NdaFormData` exactly (camelCase).


class PartyFields(BaseModel):
    company: Optional[str] = None
    printName: Optional[str] = None
    title: Optional[str] = None
    noticeAddress: Optional[str] = None


class ExtractedFields(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None  # ISO yyyy-mm-dd
    termMode: Optional[Literal["expires", "untilTerminated"]] = None
    termYears: Optional[int] = None
    confidentialityMode: Optional[Literal["years", "perpetuity"]] = None
    confidentialityYears: Optional[int] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    modifications: Optional[str] = None
    party1: Optional[PartyFields] = None
    party2: Optional[PartyFields] = None


class ChatResult(BaseModel):
    """One assistant turn, unified across modes.

    - ``docType``: the document now being drafted (set/changed by the AI).
    - ``ndaFields``: NDA updates (only in nda mode).
    - ``fields``: generic key→value updates (only in generic mode).
    """

    reply: str
    docType: Optional[str] = None
    fields: Optional[dict[str, str]] = None
    ndaFields: Optional[ExtractedFields] = None


# --- Per-mode response schemas ----------------------------------------------


class _SelectionOut(BaseModel):
    reply: str
    docType: Optional[str] = None


class _NdaOut(BaseModel):
    reply: str
    fields: ExtractedFields


# --- Prompts ----------------------------------------------------------------


def _selection_prompt() -> str:
    return f"""\
You are Prelegal's intake assistant. Your first job is to determine which legal \
document the user needs, choosing only from the supported documents below.

Supported documents (id — name: description):
{selection_catalogue()}

Guidelines:
- Have a short, friendly conversation to understand what the user needs.
- When the user clearly wants one of the supported documents, set `docType` to \
that document's exact id and confirm your choice in the reply.
- If the user asks for a document we do NOT support (e.g. an employment \
contract, a lease, a will), explain that we cannot generate that document, then \
recommend the closest supported document by name and ask whether they'd like to \
proceed with it. Only set `docType` AFTER the user agrees.
- Until a document is chosen and confirmed, leave `docType` null.
- Keep replies concise.
"""


NDA_SYSTEM_PROMPT = """\
You are Prelegal's intake assistant. You help two parties draft a Common Paper \
Mutual Non-Disclosure Agreement (Mutual NDA) by having a natural conversation \
and filling in the cover page for them.

Collect these fields (camelCase keys used in the `fields` object):
- purpose: how the parties may use each other's Confidential Information.
- effectiveDate: the agreement's effective date, as ISO "yyyy-mm-dd".
- termMode: "expires" (the NDA lasts a fixed number of years) or
  "untilTerminated"; termYears: the number of years when termMode is "expires".
- confidentialityMode: "years" or "perpetuity"; confidentialityYears: the
  number of years when confidentialityMode is "years".
- governingLaw: the US state whose law governs (full state name, e.g. "Delaware").
- jurisdiction: the city/county and state whose courts have jurisdiction.
- modifications: any free-text changes to the standard MNDA (often empty).
- party1 and party2, each with: company, printName (signer's name), title,
  noticeAddress.

Guidelines:
- Converse naturally. Ask about a few missing or unclear fields at a time; do not
  dump the whole list at once. Briefly confirm what you understood.
- In `fields`, set ONLY the values you are confident about from the conversation.
  Leave everything else null — never invent company names, people, or dates.
- Re-read the current field values provided to you; do not re-ask for fields that
  are already filled unless the user wants to change them.
- When the key fields are collected, tell the user they can review the live
  preview on the right and download the PDF.
- Keep replies concise and friendly.
"""


def _generic_prompt(spec: dict) -> str:
    return f"""\
You are Prelegal's intake assistant. You help the user draft a "{spec['name']}" \
by having a natural conversation and filling in its key terms.

{spec['description']}

Collect these fields (keys used in the `fields` object):
{generic_fields_prompt(spec)}

Guidelines:
- Converse naturally. Ask about a few missing or unclear fields at a time; do not
  dump the whole list at once. Briefly confirm what you understood.
- In `fields`, set ONLY the values you are confident about from the conversation.
  Leave everything else null — never invent companies, people, dates, or amounts.
- Re-read the current field values provided to you; do not re-ask for fields that
  are already filled unless the user wants to change them.
- When the key terms are collected, tell the user they can review the live
  preview on the right and download the PDF.
- If the user decides they actually need a different document, you may say so;
  the app will help them switch.
- Keep replies concise and friendly.
"""


# --- Engine -----------------------------------------------------------------


def _build_messages(
    history: list[dict], current_data: dict | None, system_prompt: str
) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    if current_data:
        messages.append(
            {
                "role": "system",
                "content": "Current field values (JSON):\n"
                + json.dumps(current_data, ensure_ascii=False),
            }
        )
    messages.extend(history)
    return messages


def _complete(
    history: list[dict],
    current_data: dict | None,
    system_prompt: str,
    response_model: type[BaseModel],
) -> BaseModel:
    # Imported lazily so the app (and tests that mock this) don't pay litellm's
    # import cost unless chat is actually used.
    from litellm import completion

    response = completion(
        model=MODEL,
        messages=_build_messages(history, current_data, system_prompt),
        response_format=response_model,
        reasoning_effort="low",
    )
    content = response.choices[0].message.content
    return response_model.model_validate_json(content)


def run_chat(
    history: list[dict],
    current_data: dict | None = None,
    doc_type: str | None = None,
) -> ChatResult:
    """Run one assistant turn. Raises MissingApiKeyError if no key is set."""
    if not os.environ.get(API_KEY_ENV):
        raise MissingApiKeyError(
            f"{API_KEY_ENV} is not set; AI chat is unavailable."
        )

    spec = get_document(doc_type) if doc_type else None

    # Selection mode: no (valid) document chosen yet.
    if spec is None:
        out = _complete(history, None, _selection_prompt(), _SelectionOut)
        return ChatResult(reply=out.reply, docType=out.docType)

    # Bespoke NDA mode.
    if spec["kind"] == "nda":
        out = _complete(history, current_data, NDA_SYSTEM_PROMPT, _NdaOut)
        return ChatResult(
            reply=out.reply, docType=spec["id"], ndaFields=out.fields
        )

    # Generic mode: structured output schema derived from the document.
    fields_model = generic_fields_model(spec["id"])
    out_model = create_model(
        "_GenericOut", reply=(str, ...), fields=(fields_model, ...)
    )
    out = _complete(history, current_data, _generic_prompt(spec), out_model)
    fields = out.fields.model_dump(exclude_none=True)  # type: ignore[attr-defined]
    return ChatResult(reply=out.reply, docType=spec["id"], fields=fields)
