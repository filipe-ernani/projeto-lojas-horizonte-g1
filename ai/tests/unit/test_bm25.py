from copy import deepcopy

import pytest

from agente_horizonte.config import bm25_top_k
from agente_horizonte.retrieval.bm25 import BM25Retriever
from agente_horizonte.retrieval.document_loader import (
    build_product_documents,
    build_review_documents,
)
from search import parse_rating_query


@pytest.fixture
def documents():
    return build_product_documents(
        [
            {"sku": "sku-1", "nome": "Tênis azul azul"},
            {"sku": "sku-2", "nome": "Tênis corrida vermelho"},
            {"sku": "sku-3", "nome": "Camiseta algodão"},
            {"sku": "sku-4", "nome": "Mochila escolar"},
            {"sku": "sku-5", "nome": "Cafeteira elétrica"},
        ],
        source="test.default.catalog",
    ) + build_review_documents(
        [{"review_id": "r-1", "sku": "sku-1", "comment": "Macio e confortável"}],
        source="test.default.reviews",
        product_id_field="sku",
        review_id_field="review_id",
        text_fields=("comment",),
    )


def test_ranks_matching_products_and_returns_content_source_and_numeric_score(documents):
    results = BM25Retriever(documents).search("TÊNIS AZUL!")

    assert [result["product_id"] for result in results] == ["sku-1", "sku-2"]
    assert results[0]["score"] > results[1]["score"] > 0
    assert type(results[0]["score"]) is float
    assert results[0] == {
        "product_id": "sku-1",
        "type": "product",
        "text": "tenis azul azul",
        "source": documents[0]["source"],
        "score": results[0]["score"],
    }


def test_finds_review_and_preserves_its_identifier(documents):
    results = BM25Retriever(documents).search("CONFORTÁVEL")

    assert len(results) == 1
    assert results[0]["product_id"] == "sku-1"
    assert results[0]["type"] == "review"
    assert results[0]["review_id"] == "r-1"
    assert results[0]["text"] == "macio e confortavel"
    assert results[0]["source"]["table"] == "test.default.reviews"
    assert results[0]["source"]["row"]["review_id"] == "r-1"


def test_configured_top_k_and_per_query_override(documents):
    retriever = BM25Retriever(documents, top_k=1)
    assert len(retriever.search("tenis")) == 1
    assert len(retriever.search("tenis", top_k=2)) == 2
    assert len(retriever.search("tenis", top_k=100)) == 2
    assert len(retriever.search("tenis")) == 1


@pytest.mark.parametrize("value", [0, -1, 1.5, "2", True])
def test_rejects_invalid_top_k_at_construction_and_search(value, documents):
    with pytest.raises(ValueError, match="top_k"):
        BM25Retriever(documents, top_k=value)
    with pytest.raises(ValueError, match="top_k"):
        BM25Retriever(documents).search("tenis", top_k=value)


@pytest.mark.parametrize("query", ["", "  ", "...", "televisor", "televisor inexistente"])
def test_empty_or_unknown_query_has_no_results(query, documents):
    assert BM25Retriever(documents).search(query) == []


def test_empty_corpus_and_empty_token_documents():
    assert BM25Retriever([]).search("tenis") == []
    assert BM25Retriever([{"tokens": []}]).search("tenis") == []


def test_matching_document_with_negative_score_is_returned(documents):
    results = BM25Retriever(documents[:1]).search("tenis", top_k=5)
    assert len(results) == 1
    assert results[0]["product_id"] == "sku-1"
    assert results[0]["score"] < 0


def test_zero_score_match_is_returned_without_unrelated_documents(documents):
    results = BM25Retriever(documents[:2]).search("azul")
    assert len(results) == 1
    assert results[0]["product_id"] == "sku-1"
    assert results[0]["score"] == 0


def test_ties_keep_corpus_order(documents):
    second = deepcopy(documents[0])
    second["product_id"] = "sku-other"
    results = BM25Retriever([documents[0], second]).search("azul")
    assert [result["product_id"] for result in results] == ["sku-1", "sku-other"]
    assert results[0]["score"] == results[1]["score"]


def test_input_and_results_cannot_mutate_the_index(documents):
    retriever = BM25Retriever(documents)
    documents[0]["tokens"].clear()
    documents[0]["text"] = "changed"
    documents[0]["source"]["row"]["sku"] = "changed"
    results = retriever.search("azul")
    results[0]["source"]["row"]["sku"] = "changed again"

    result = retriever.search("azul")[0]
    assert result["text"] == "tenis azul azul"
    assert result["source"]["row"]["sku"] == "sku-1"


def test_rebuild_replaces_documents_and_can_clear_the_index(documents):
    retriever = BM25Retriever(documents)
    updated = build_product_documents(
        [{"sku": "new-sku", "nome": "Notebook leve"}], source="test.default.catalog"
    )
    retriever.rebuild(updated)
    assert retriever.search("tenis") == []
    assert retriever.search("notebook")[0]["product_id"] == "new-sku"
    retriever.rebuild([])
    assert retriever.search("notebook") == []


def test_failed_index_build_keeps_previous_results(monkeypatch, documents):
    retriever = BM25Retriever(documents)
    before = retriever.search("azul")

    def fail(corpus):
        raise ValueError("Index construction failed")

    monkeypatch.setattr("agente_horizonte.retrieval.bm25.BM25Okapi", fail)
    with pytest.raises(ValueError, match="Index construction failed"):
        retriever.rebuild(documents[2:])
    assert retriever.search("azul") == before


def test_top_k_environment_default_and_override(monkeypatch, documents):
    monkeypatch.delenv("BM25_TOP_K", raising=False)
    assert bm25_top_k() == 5
    monkeypatch.setenv("BM25_TOP_K", "1")
    assert len(BM25Retriever(documents, top_k=bm25_top_k()).search("tenis")) == 1


@pytest.mark.parametrize("value", ["0", "-1", "1.5", "", "invalid"])
def test_invalid_top_k_environment_is_rejected(monkeypatch, value):
    monkeypatch.setenv("BM25_TOP_K", value)
    with pytest.raises(ValueError, match="BM25_TOP_K"):
        bm25_top_k()


@pytest.fixture
def rated_documents(documents):
    documents[0].update(average_rating=2.0, review_count=3)
    documents[1].update(average_rating=5.0, review_count=1)
    documents[2].update(average_rating=4.5, review_count=2)
    # An unrated item still participates in ordinary lexical searches.
    documents[3].update(average_rating=None, review_count=0)
    return documents


def test_ranking_by_rating_happens_before_top_k_and_preserves_lexical_relevance(rated_documents):
    retriever = BM25Retriever(rated_documents)
    assert retriever.search("tenis azul", top_k=1)[0]["product_id"] == "sku-1"
    result = retriever.search("tenis azul", top_k=1, sort_by_rating=True)[0]
    assert result["product_id"] == "sku-2"
    assert result["average_rating"] == 5
    assert result["review_count"] == 1
    # The 4.5-rated shirt does not match the requested product terms.
    assert [result["product_id"] for result in retriever.search("tenis", sort_by_rating=True)] == [
        "sku-2",
        "sku-1",
    ]


def test_rating_only_query_lists_rated_products_once(rated_documents):
    results = BM25Retriever(rated_documents).search("", sort_by_rating=True)
    assert [result["product_id"] for result in results] == ["sku-2", "sku-3", "sku-1"]
    assert all(result["type"] == "product" for result in results)


def test_unrated_or_unknown_products_are_not_recommended_by_rating(rated_documents):
    retriever = BM25Retriever(rated_documents)
    assert retriever.search("mochila")
    assert retriever.search("mochila", sort_by_rating=True) == []
    assert retriever.search("inexistente", sort_by_rating=True) == []


def test_equal_ratings_are_ordered_by_bm25_relevance(rated_documents):
    rated_documents[0]["average_rating"] = 5.0
    results = BM25Retriever(rated_documents).search("tenis azul", sort_by_rating=True)
    assert [result["product_id"] for result in results] == ["sku-1", "sku-2"]
    assert results[0]["score"] > results[1]["score"]


@pytest.mark.parametrize(
    ("query", "expected", "requested"),
    [
        ("Tênis com maiores notas", "tenis", True),
        ("Tênis com as melhores notas!", "tenis", True),
        ("calçados mais bem avaliados", "calcados", True),
        ("Maiores notas", "", True),
        ("Tênis azul", "Tênis azul", False),
    ],
)
def test_recognizes_explicit_rating_requests(query, expected, requested):
    assert parse_rating_query(query) == (expected, requested)
