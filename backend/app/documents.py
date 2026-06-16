"""Document-type registry and prompt/schema builders (PL-6).

The registry itself is the shared ``documents.json`` (single source of truth,
also consumed by the frontend). This module loads it and derives, per document:

  * the selection catalogue used when the AI is figuring out *which* document
    the user wants;
  * a flat list of leaf fields (``party`` terms expand into four sub-fields);
  * a dynamic Pydantic model for structured extraction of a generic document's
    fields.
"""

from __future__ import annotations

import json
from functools import lru_cache
from typing import Optional

from pydantic import BaseModel, create_model

from .config import DOCUMENTS_PATH

# Sub-fields a ``party`` key expands into — must match the frontend's
# PARTY_SUBFIELDS in lib/documents.ts.
PARTY_SUBFIELDS: list[tuple[str, str]] = [
    ("company", "Company"),
    ("name", "Print Name"),
    ("title", "Title"),
    ("notice", "Notice Address"),
]


@lru_cache(maxsize=1)
def load_documents() -> list[dict]:
    """All registered documents (cached). Reads the shared documents.json."""
    raw = json.loads(DOCUMENTS_PATH.read_text(encoding="utf-8"))
    return raw["documents"]


def get_document(doc_id: str) -> Optional[dict]:
    return next((d for d in load_documents() if d["id"] == doc_id), None)


def selection_catalogue() -> str:
    """A bulleted ``id — name: description`` list for the selection prompt."""
    return "\n".join(
        f"- {d['id']} — {d['name']}: {d['description']}" for d in load_documents()
    )


def leaf_fields(spec: dict) -> list[dict]:
    """Flatten a generic document's keyTerms into leaf fields.

    Each entry: {key, label, hint?, type, options?}. A ``party`` term expands
    into four leaf fields (``<key>_company`` etc.).
    """
    leaves: list[dict] = []
    for term in spec.get("keyTerms", []):
        if term["type"] == "party":
            for suffix, sub_label in PARTY_SUBFIELDS:
                leaves.append(
                    {
                        "key": f"{term['key']}_{suffix}",
                        "label": f"{term['label']} — {sub_label}",
                        "type": "text",
                    }
                )
        else:
            leaves.append(
                {
                    "key": term["key"],
                    "label": term["label"],
                    "hint": term.get("hint"),
                    "type": term["type"],
                    "options": term.get("options"),
                }
            )
    return leaves


@lru_cache(maxsize=None)
def generic_fields_model(doc_id: str) -> type[BaseModel]:
    """A dynamic Pydantic model: one Optional[str] per leaf field of ``doc_id``.

    Used as the structured-output schema so the LLM returns only this document's
    known keys (never free-form), which we can merge straight into the preview.
    """
    spec = get_document(doc_id)
    if spec is None:
        raise KeyError(doc_id)
    field_defs = {
        leaf["key"]: (Optional[str], None) for leaf in leaf_fields(spec)
    }
    safe = doc_id.replace("-", "_").title().replace("_", "")
    return create_model(f"{safe}Fields", **field_defs)  # type: ignore[call-overload]


def generic_fields_prompt(spec: dict) -> str:
    """Human-readable field list injected into the generic drafting prompt."""
    lines: list[str] = []
    for leaf in leaf_fields(spec):
        bits = [f"- {leaf['key']}: {leaf['label']}"]
        if leaf.get("hint"):
            bits.append(f"({leaf['hint']})")
        if leaf["type"] == "date":
            bits.append('— ISO "yyyy-mm-dd"')
        if leaf.get("options"):
            bits.append("— one of: " + ", ".join(leaf["options"]))
        lines.append(" ".join(bits))
    return "\n".join(lines)
