from copy import deepcopy
from decimal import Decimal
from unittest.mock import Mock

import pytest

from agente_horizonte.retrieval.bm25 import BM25Retriever
from agente_horizonte.retrieval.document_loader import (
    build_product_documents,
    build_review_documents,
    load_documents_from_databricks,
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


@pytest.mark.parametrize(
    ("rating", "count", "expected_rating", "expected_count"),
    [
        (Decimal("4.75"), 12, 4.75, 12),
        (None, 0, None, 0),
        (Decimal("4.75"), 0, None, 0),
        (6, 3, None, 3),
        (float("nan"), 3, None, 3),
        (True, 3, None, 3),
        ("4.75", 3, None, 3),
        (4.75, -1, None, None),
        (4.75, None, None, None),
        (4.75, True, None, None),
    ],
)
def test_catalog_rating_aggregates_are_validated(rating, count, expected_rating, expected_count):
    row = {"sku": "sku-1", "nome": "Camiseta", "nota_media": rating, "qtd_avaliacoes": count}
    document = build_product_documents([row], source="test.default.catalog")[0]
    assert document["average_rating"] == expected_rating
    assert document["review_count"] == expected_count
    assert document["source"]["row"] == row


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
            "review_id": "Review-001",
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
    assert [document["review_id"] for document in documents] == ["r-1", "r-2"]
    results = BM25Retriever(documents).search("boa ruim")
    assert {result["review_id"] for result in results} == {"r-1", "r-2"}


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


@pytest.fixture
def databricks_loader(monkeypatch):
    for name, value in {
        "DATABRICKS_CATALOG_TABLE": "test.default.catalog",
        "DATABRICKS_CATALOG_PRODUCT_ID_COLUMN": "catalog_sku",
        "DATABRICKS_CATALOG_CATEGORY_COLUMN": "categoria",
        "DATABRICKS_REVIEWS_TABLE": "test.default.reviews",
        "DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN": "product_sku",
    }.items():
        monkeypatch.setenv(name, value)
    products = Mock(return_value=[{"catalog_sku": "sku-1", "nome": "Tênis azul"}])
    reviews = Mock(
        return_value=[{"review_id": "r-1", "product_sku": "sku-1", "comment": "Confortável"}]
    )
    monkeypatch.setattr("agente_horizonte.retrieval.document_loader.fetch_products", products)
    monkeypatch.setattr("agente_horizonte.retrieval.document_loader.fetch_reviews", reviews)
    return products, reviews


def test_load_catalog_and_explicitly_rebuild_from_databricks(databricks_loader):
    products, reviews = databricks_loader
    retriever = BM25Retriever(load_documents_from_databricks())
    assert retriever.search("azul")[0]["product_id"] == "sku-1"
    assert retriever.search("azul")[0]["source"]["table"] == "test.default.catalog"
    products.assert_called_once_with(limit=None)
    reviews.assert_not_called()

    products.return_value = [{"catalog_sku": "sku-new", "nome": "Cafeteira elétrica"}]
    retriever.rebuild(load_documents_from_databricks())
    assert retriever.search("azul") == []
    assert retriever.search("cafeteira")[0]["product_id"] == "sku-new"
    assert products.call_count == 2
    reviews.assert_not_called()


def test_load_catalog_and_reviews_with_confirmed_field_mapping(databricks_loader):
    products, reviews = databricks_loader
    documents = load_documents_from_databricks(
        review_id_field="review_id", review_text_fields=("comment",)
    )
    assert [document["type"] for document in documents] == ["product", "review"]
    result = BM25Retriever(documents).search("confortável")[0]
    assert result["review_id"] == "r-1"
    assert result["source"]["row"]["review_id"] == "r-1"
    assert result["source"]["table"] == "test.default.reviews"
    assert result["product_id"] == "sku-1"
    products.assert_called_once_with(limit=None)
    reviews.assert_called_once_with(limit=None)


def test_gold_reviews_index_title_or_comment_and_count_ratings_without_text(
    monkeypatch, databricks_loader
):
    products, reviews = databricks_loader
    monkeypatch.setenv("DATABRICKS_REVIEWS_TABLE", "horizonte.gold.gold_avaliacoes")
    monkeypatch.setenv("DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN", "sku")
    reviews.return_value = [
        {
            "avaliacao_id": "a-1",
            "sku": "sku-1",
            "nota": 5,
            "titulo": "Perfeito",
            "comentario": None,
        },
        {"avaliacao_id": "a-2", "sku": "sku-1", "nota": 4, "titulo": None, "comentario": "Macio"},
        {"avaliacao_id": "a-3", "sku": "sku-1", "nota": 3, "titulo": None, "comentario": None},
    ]
    documents = load_documents_from_databricks(
        review_id_field="avaliacao_id", review_text_fields=("titulo", "comentario")
    )
    assert [document["type"] for document in documents] == ["product", "review", "review"]
    assert documents[0]["average_rating"] == 4
    assert documents[0]["review_count"] == 3
    retriever = BM25Retriever(documents)
    for query, identifier in (("perfeito", "a-1"), ("macio", "a-2")):
        result = retriever.search(query)[0]
        assert result["review_id"] == identifier
        assert result["source"]["row"]["avaliacao_id"] == identifier
        assert result["source"]["table"] == "horizonte.gold.gold_avaliacoes"
    products.assert_called_once_with(limit=None)
    reviews.assert_called_once_with(limit=None)


@pytest.mark.parametrize(
    "options",
    [
        {"review_id_field": "review_id"},
        {"review_id_field": "", "review_text_fields": ("comment",)},
        {"review_id_field": "  ", "review_text_fields": ("comment",)},
    ],
)
def test_incomplete_review_mapping_fails_before_query(databricks_loader, options):
    products, reviews = databricks_loader
    with pytest.raises(ValueError, match="Provide review_text_fields"):
        load_documents_from_databricks(**options)
    products.assert_not_called()
    reviews.assert_not_called()


def test_unconfigured_reviews_fail_before_query(monkeypatch, databricks_loader):
    products, reviews = databricks_loader
    monkeypatch.delenv("DATABRICKS_REVIEWS_TABLE", raising=False)
    with pytest.raises(ValueError, match="DATABRICKS_REVIEWS_TABLE"):
        load_documents_from_databricks(review_id_field="review_id", review_text_fields=("comment",))
    products.assert_not_called()
    reviews.assert_not_called()


def test_catalog_loads_when_both_review_settings_are_empty(monkeypatch, databricks_loader):
    products, reviews = databricks_loader
    monkeypatch.setenv("DATABRICKS_REVIEWS_TABLE", "")
    monkeypatch.setenv("DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN", "")
    documents = load_documents_from_databricks(
        review_id_field="review_id", review_text_fields=("comment",)
    )
    assert [document["type"] for document in documents] == ["product"]
    products.assert_called_once_with(limit=None)
    reviews.assert_not_called()


def test_catalog_aggregates_are_not_replaced_by_partial_reviews(databricks_loader):
    products, reviews = databricks_loader
    products.return_value[0].update(nota_media=Decimal("4.75"), qtd_avaliacoes=20)
    reviews.return_value[0]["nota"] = 1
    documents = load_documents_from_databricks(
        review_id_field="review_id", review_text_fields=("comment",)
    )
    assert documents[0]["average_rating"] == 4.75
    assert documents[0]["review_count"] == 20
    assert documents[1]["source"]["row"]["nota"] == 1


@pytest.mark.parametrize("failing_source", ["catalog", "reviews"])
def test_failed_databricks_reload_preserves_existing_index(databricks_loader, failing_source):
    products, reviews = databricks_loader
    retriever = BM25Retriever(load_documents_from_databricks())
    previous = retriever.search("tenis")
    failing_fetch = products if failing_source == "catalog" else reviews
    failing_fetch.side_effect = ConnectionError("Databricks unavailable")

    with pytest.raises(ConnectionError, match="Databricks unavailable"):
        retriever.rebuild(
            load_documents_from_databricks(
                review_id_field="review_id", review_text_fields=("comment",)
            )
        )
    assert retriever.search("tenis") == previous


def test_reviews_without_id_column_preserve_explicit_sku_and_original_rows():
    rows = [
        {"sku": "sku-1", "comentario": "Entrega rápida"},
        {"sku": "sku-1", "comentario": "Ótima qualidade"},
        {"sku": ["sku-1", "sku-2"], "comentario": "Vínculo ambíguo"},
        {"comentario": "Sem produto"},
        {"sku": "sku-2", "comentario": None},
    ]
    documents = build_review_documents(
        rows,
        source="test.default.reviews",
        product_id_field="sku",
        review_id_field=None,
        text_fields=("comentario",),
    )
    assert len(documents) == 2
    assert [document["product_id"] for document in documents] == ["sku-1", "sku-1"]
    assert [document["text"] for document in documents] == ["entrega rapida", "otima qualidade"]
    assert [document["source"]["row"] for document in documents] == rows[:2]
    assert all("review_id" not in document["source"]["row"] for document in documents)


def test_load_reviews_without_id_column_and_search_comment(databricks_loader):
    products, reviews = databricks_loader
    reviews.return_value = [{"product_sku": "sku-1", "comentario": "Entrega rápida"}]
    documents = load_documents_from_databricks(review_text_fields=("comentario",))

    results = BM25Retriever(documents).search("entrega")
    assert len(results) == 1
    assert results[0]["type"] == "review"
    assert results[0]["product_id"] == "sku-1"
    assert results[0]["source"]["row"] == reviews.return_value[0]
    products.assert_called_once_with(limit=None)
    reviews.assert_called_once_with(limit=None)


def test_product_average_uses_valid_reviews_once_including_ratings_without_text(databricks_loader):
    products, reviews = databricks_loader
    products.return_value += [{"catalog_sku": "sku-2", "nome": "Mochila"}]
    reviews.return_value = [
        {"review_id": "r-1", "product_sku": "sku-1", "nota": 1, "comment": "Frágil"},
        {"review_id": "r-2", "product_sku": "sku-1", "nota": 5, "comment": None},
        {"review_id": "r-1", "product_sku": "sku-1", "nota": 1, "comment": "Frágil"},
        {"review_id": None, "product_sku": "sku-1", "nota": 5, "comment": "Sem ID"},
        {"review_id": "ambiguous", "product_sku": "sku-1", "nota": 5},
        {"review_id": "ambiguous", "product_sku": "sku-2", "nota": 1},
    ]
    documents = load_documents_from_databricks(
        review_id_field="review_id", review_text_fields=("comment",)
    )
    assert documents[0]["average_rating"] == 3
    assert documents[0]["review_count"] == 2
    assert documents[1]["average_rating"] is None
    assert documents[1]["review_count"] == 0
    assert all(document.get("review_id") != "r-2" for document in documents)
    result = BM25Retriever(documents).search("tenis", sort_by_rating=True)[0]
    assert result["average_rating"] == 3
    assert result["review_count"] == 2


@pytest.mark.parametrize("rating", [None, "5", True, 0, 6, float("nan"), float("inf")])
def test_invalid_ratings_do_not_create_a_product_average(databricks_loader, rating):
    _, reviews = databricks_loader
    reviews.return_value[0]["nota"] = rating
    documents = load_documents_from_databricks(
        review_id_field="review_id", review_text_fields=("comment",)
    )
    assert documents[0]["average_rating"] is None
    assert documents[0]["review_count"] == 0
    assert BM25Retriever(documents).search("tenis", sort_by_rating=True) == []


def test_duplicate_review_ids_produce_one_document_and_keep_first_row():
    row = {"review_id": "r-1", "product_sku": "sku-1", "comment": "Primeiro comentário"}
    documents = prepare_reviews([row, row.copy(), {**row, "comment": "Outro conteúdo"}])
    assert len(documents) == 1
    assert documents[0]["source"]["row"] == row


def test_duplicates_do_not_hide_a_conflicting_link():
    row = {"review_id": "r-1", "product_sku": "sku-1", "comment": "Comentário"}
    assert prepare_reviews([row, row.copy(), {**row, "product_sku": "sku-2"}]) == []


def test_reviews_without_ids_are_not_deduplicated():
    row = {"sku": "sku-1", "comment": "Mesmo texto"}
    documents = build_review_documents(
        [row, row.copy()],
        source="test.reviews",
        product_id_field="sku",
        review_id_field=None,
        text_fields=("comment",),
    )
    assert len(documents) == 2


def test_load_validates_reviews_only_once(databricks_loader, monkeypatch):
    from agente_horizonte.retrieval import document_loader

    validate = Mock(wraps=document_loader._valid_review_rows)
    monkeypatch.setattr(document_loader, "_valid_review_rows", validate)
    load_documents_from_databricks(review_id_field="review_id", review_text_fields=("comment",))
    assert validate.call_count == 1
