"""Tests for the document-type registry and its derived schemas (PL-6)."""

from __future__ import annotations

from app import documents


def test_registry_loads_nda_and_generic():
    docs = documents.load_documents()
    ids = {d["id"] for d in docs}
    assert "mutual-nda" in ids
    assert "partnership-agreement" in ids

    nda = documents.get_document("mutual-nda")
    assert nda["kind"] == "nda"
    assert "keyTerms" not in nda  # bespoke path, no generic schema


def test_every_generic_doc_has_keyterms():
    for doc in documents.load_documents():
        if doc["kind"] == "generic":
            assert doc.get("keyTerms"), doc["id"]


def test_leaf_fields_expand_party_into_four():
    spec = documents.get_document("partnership-agreement")
    keys = {f["key"] for f in documents.leaf_fields(spec)}
    assert {"party1_company", "party1_name", "party1_title", "party1_notice"} <= keys
    assert "purpose" in keys  # non-party term stays one field


def test_generic_fields_model_accepts_known_keys_only():
    Model = documents.generic_fields_model("partnership-agreement")
    inst = Model.model_validate({"purpose": "x", "party1_company": "Acme"})
    dumped = inst.model_dump(exclude_none=True)
    assert dumped == {"purpose": "x", "party1_company": "Acme"}

    # Unknown keys are ignored by the model (not part of its schema).
    inst2 = Model.model_validate({"bogus": "y"})
    assert inst2.model_dump(exclude_none=True) == {}


def test_selection_catalogue_lists_documents():
    cat = documents.selection_catalogue()
    assert "mutual-nda" in cat
    assert "Partnership Agreement" in cat
