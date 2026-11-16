from copy import deepcopy

import pytest

from agente_horizonte.retrieval.document_loader import (
    build_product_documents,
    build_review_documents,
)
from agente_horizonte.retrieval.preprocessing import tokenize


def prepare_reviews(rows):
    # Illustrative columns only: the real reviews contract is not available yet.
    return build_review_documents(
        rows,
        source="test.default.reviews",
        product_id_field="product_sku",
        review_id_field="review_id",
        text_fields=("title", "comment"),
    )


def test_product_document_uses_catalog_text_and_preserves_identifiers_and_source():
    row = {
        "sku": "SKU-Á-001",
        "nome": "Camiseta AZUL",
        "modelo": "Básico",
        "categoria": "Moda",
        "grupo": "Verão",
        "preco": 49.90,
        "custo": 20.0,
        "popularidade": 7.0,
    }
    original = deepcopy(row)

    documents = build_product_documents([row], source="test.default.catalog")

    assert documents == [
        {
            "product_id": "SKU-Á-001",
            "type": "product",
            "text": "camiseta azul basico moda verao",
            "tokens": ["camiseta", "azul", "basico", "moda", "verao"],
            "source": {"table": "test.default.catalog", "row": original},
        }
    ]
    assert row == original
    assert documents[0]["source"]["row"] is not row


def test_partial_product_text_and_configured_identifier():
    documents = build_product_documents(
        [{"product_sku": "001", "nome": None, "modelo": "", "categoria": "Calçados"}],
        source="test.default.catalog",
        product_id_field="product_sku",
    )
    assert documents[0]["product_id"] == "001"
    assert documents[0]["tokens"] == ["calcados"]


@pytest.mark.parametrize("product_id", [None, "", "  ", ["sku-1", "sku-2"], {"sku": "sku-1"}])
def test_product_without_scalar_identifier_is_omitted(product_id):
    assert (
        build_product_documents(
            [{"sku": product_id, "nome": "Camiseta"}], source="test.default.catalog"
        )
        == []
    )


@pytest.mark.parametrize("text", [None, "", " \n", "...", 42])
def test_product_without_searchable_text_is_omitted(text):
    assert (
        build_product_documents([{"sku": "sku-1", "nome": text}], source="test.default.catalog")
        == []
    )


def test_empty_inputs():
    assert build_product_documents([], source="test.default.catalog") == []
    assert prepare_reviews([]) == []


def test_review_uses_only_text_and_preserves_source_fields():
    row = {
        "review_id": "Review-001",
        "product_sku": "SKU-001",
        "order_id": "Order-001",
        "title": "Ótima compra!",
        "comment": "Não encolheu. Muito boa!",
        "score": 5,
    }
    original = deepcopy(row)
    documents = prepare_reviews([row])

    assert documents == [
        {
            "product_id": "SKU-001",
            "type": "review",
            "text": "otima compra nao encolheu muito boa",
            "tokens": ["otima", "compra", "nao", "encolheu", "muito", "boa"],
            "source": {"table": "test.default.reviews", "row": original},
        }
    ]
    assert row == original
    assert documents[0]["source"]["row"] is not row


@pytest.mark.parametrize("text", [None, "", " \t", "...", 5])
def test_rating_without_text_is_not_a_search_document(text):
    assert (
        prepare_reviews(
            [
                {
                    "review_id": "r-1",
                    "product_sku": "sku-1",
                    "title": text,
                    "comment": text,
                    "score": 5,
                }
            ]
        )
        == []
    )


@pytest.mark.parametrize("field", ["title", "comment"])
def test_review_with_only_one_text_field_is_searchable(field):
    documents = prepare_reviews([{"review_id": "r-1", "product_sku": "sku-1", field: "Ótima!"}])
    assert documents[0]["tokens"] == ["otima"]


@pytest.mark.parametrize("product_id", [None, "", " ", ["sku-1", "sku-2"]])
def test_review_without_explicit_scalar_product_link_is_omitted(product_id):
    assert (
        prepare_reviews(
            [{"review_id": "r-1", "order_id": "o-1", "product_sku": product_id, "comment": "Boa"}]
        )
        == []
    )


def test_order_identifier_is_never_used_as_a_product_link():
    assert prepare_reviews([{"review_id": "r-1", "order_id": "sku-1", "comment": "Boa"}]) == []


@pytest.mark.parametrize("review_id", [None, "", " ", ["r-1", "r-2"]])
def test_review_without_identifier_is_omitted(review_id):
    assert (
        prepare_reviews([{"review_id": review_id, "product_sku": "sku-1", "comment": "Boa"}]) == []
    )


@pytest.mark.parametrize("other_product", ["sku-2", None, ["sku-1", "sku-2"]])
def test_conflicting_links_omit_all_rows_for_the_review(other_product):
    rows = [
        {"review_id": "ambiguous", "product_sku": "sku-1", "comment": "Boa"},
        {"review_id": "valid", "product_sku": "sku-1", "comment": "Excelente"},
        {"review_id": "ambiguous", "product_sku": other_product, "comment": None},
    ]
    original = deepcopy(rows)

    documents = prepare_reviews(rows)

    assert len(documents) == 1
    assert documents[0]["source"]["row"]["review_id"] == "valid"
    assert rows == original


def test_distinct_reviews_for_the_same_product_remain_searchable():
    documents = prepare_reviews(
        [
            {"review_id": "r-1", "product_sku": "sku-1", "comment": "Boa"},
            {"review_id": "r-2", "product_sku": "sku-1", "comment": "Ruim"},
        ]
    )
    assert [document["tokens"] for document in documents] == [["boa"], ["ruim"]]


def test_bm25_corpus_keeps_document_positions_and_query_normalization():
    documents = build_product_documents(
        [{"sku": "sku-1", "nome": "Tênis AZUL"}, {"sku": "sku-empty"}],
        source="test.default.catalog",
    ) + prepare_reviews(
        [{"review_id": "r-1", "product_sku": "sku-1", "comment": "Tênis confortável!"}]
    )
    corpus = [document["tokens"] for document in documents]

    assert corpus == [["tenis", "azul"], ["tenis", "confortavel"]]
    assert all(isinstance(token, str) for tokens in corpus for token in tokens)
    assert tokenize("TÊNIS confortável") == corpus[1]
    assert documents[1]["source"]["row"]["review_id"] == "r-1"
