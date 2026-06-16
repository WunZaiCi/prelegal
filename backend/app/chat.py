"""AI chat that interviews the user and fills the Mutual NDA cover page.

A single LLM call per turn returns both the assistant's natural-language reply
and a structured extraction of any NDA fields it learned, so the frontend can
merge those updates straight into the live preview.

LLM access uses LiteLLM with Cerebras as the inference provider — model
``cerebras/gpt-oss-120b`` — using structured outputs. The credential is read
from ``CEREBRAS_API_KEY`` (see the repo-root ``.env``).
"""

from __future__ import annotations

import json
import os
from typing import Literal, Optional

from pydantic import BaseModel

MODEL = "cerebras/gpt-oss-120b"
API_KEY_ENV = "CEREBRAS_API_KEY"


class MissingApiKeyError(RuntimeError):
    """Raised when the Cerebras API key is not configured."""


# --- Structured output ------------------------------------------------------
# Field names mirror the frontend `NdaFormData` exactly (camelCase) so the
# returned JSON can be merged into the form state without translation. Every
# field is optional: the model only sets what it is confident about.


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
    """One assistant turn: a reply plus any fields learned this turn."""

    reply: str
    fields: ExtractedFields


SYSTEM_PROMPT = """\
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


def _build_messages(history: list[dict], current_data: dict | None) -> list[dict]:
    messages: list[dict] = [{"role": "system", "content": SYSTEM_PROMPT}]
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


def run_chat(history: list[dict], current_data: dict | None = None) -> ChatResult:
    """Run one assistant turn. Raises MissingApiKeyError if no key is set."""
    if not os.environ.get(API_KEY_ENV):
        raise MissingApiKeyError(
            f"{API_KEY_ENV} is not set; AI chat is unavailable."
        )

    # Imported lazily so the app (and tests that mock this) don't pay litellm's
    # import cost unless chat is actually used.
    from litellm import completion

    response = completion(
        model=MODEL,
        messages=_build_messages(history, current_data),
        response_format=ChatResult,
        reasoning_effort="low",
    )
    content = response.choices[0].message.content
    return ChatResult.model_validate_json(content)
