import os

import pytest

from agente_horizonte.data.databricks_client import fetch_products, fetch_reviews
from agente_horizonte.retrieval.bm25 import BM25Retriever
from agente_horizonte.retrieval.document_loader import (
    build_product_documents,
    load_documents_from_databricks,
)
from agente_horizonte.retrieval.preprocessing import tokenize

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.getenv("RUN_DATABRICKS_INTEGRATION") != "1",
        reason="Set RUN_DATABRICKS_INTEGRATION=1 to query the real SQL warehouse",
    ),
]


def test_catalog_reads_and_filters_real_records():
    records = fetch_products(limit=10)
    assert records, "The prepared catalog must contain records to validate retrieval"
    id_column = os.environ["DATABRICKS_CATALOG_PRODUCT_ID_COLUMN"].strip()
    category_column = os.environ["DATABRICKS_CATALOG_CATEGORY_COLUMN"].strip()
    sample = next(
        (row for row in records if row[id_column] is not None and row[category_column] is not None),
        None,
    )
    assert sample is not None, "No product with both an identifier and a category was found"
    for filters in (
        {"product_id": str(sample[id_column])},
        {"category": str(sample[category_column])},
        {"product_id": str(sample[id_column]), "category": str(sample[category_column])},
    ):
        results = fetch_products(**filters, limit=5)
        assert results
        if "product_id" in filters:
            assert all(row[id_column] == sample[id_column] for row in results)
        if "category" in filters:
            assert all(row[category_column] == sample[category_column] for row in results)


def test_reviews_read_and_filter_real_records():
    if not os.getenv("DATABRICKS_REVIEWS_TABLE") or not os.getenv(
        "DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN"
    ):
        pytest.skip("Blocked: prepared reviews and their product relationship are not available")
    records = fetch_reviews(limit=10)
    assert records, "The prepared reviews table must contain records to validate retrieval"
    assert all(
        isinstance(row.get("review_id"), str) and row["review_id"].strip() for row in records
    )
    id_column = os.environ["DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN"].strip()
    sample = next((row for row in records if row[id_column] is not None), None)
    assert sample is not None, "No review with a product identifier was found"
    results = fetch_reviews(product_id=str(sample[id_column]), limit=5)
    assert results
    assert all(row[id_column] == sample[id_column] for row in results)
    products = fetch_products(product_id=str(sample[id_column]), limit=1)
    assert products, "The review must reference a product in the prepared catalog"
    category_column = os.environ["DATABRICKS_CATALOG_CATEGORY_COLUMN"].strip()
    category = products[0][category_column]
    assert category is not None, "A category is required to validate filtering reviews"
    for filters in (
        {"category": str(category)},
        {"product_id": str(sample[id_column]), "category": str(category)},
    ):
        results = fetch_reviews(**filters, limit=5)
        assert results
        for row in results:
            assert fetch_products(product_id=str(row[id_column]), category=str(category), limit=1)


def test_catalog_prepares_real_documents():
    records = fetch_products(limit=10)
    id_column = os.environ["DATABRICKS_CATALOG_PRODUCT_ID_COLUMN"].strip()
    table = os.environ["DATABRICKS_CATALOG_TABLE"].strip()
    documents = build_product_documents(records, source=table, product_id_field=id_column)

    assert documents, "The catalog must produce searchable documents"
    for document in documents:
        row = document["source"]["row"]
        assert row in records
        assert document["product_id"] == row[id_column]
        assert document["source"]["table"] == table
        assert document["type"] == "product"
        assert document["tokens"] == tokenize(document["text"])
        assert document["tokens"]


def test_catalog_bm25_search_and_rebuild_real_data():
    documents = load_documents_from_databricks()
    assert documents, "The catalog must produce searchable documents"
    query = documents[0]["text"]
    retriever = BM25Retriever(documents, top_k=3)

    def check_results(current_documents):
        results = retriever.search(query)
        assert results, "A query taken from the catalog must find matching documents"
        assert len(results) <= 3
        assert [result["score"] for result in results] == sorted(
            [result["score"] for result in results], reverse=True
        )
        query_tokens = set(tokenize(query))
        for result in results:
            assert query_tokens.intersection(tokenize(result["text"]))
            assert any(
                result["product_id"] == document["product_id"]
                and result["text"] == document["text"]
                and result["source"] == document["source"]
                for document in current_documents
            )

    check_results(documents)
    refreshed = load_documents_from_databricks()
    retriever.rebuild(refreshed)
    check_results(refreshed)


def test_reviews_bm25_search_and_rebuild_real_data():
    if not os.getenv("DATABRICKS_REVIEWS_TABLE") or not os.getenv(
        "DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN"
    ):
        pytest.skip("Configure the prepared reviews table and its product identifier")

    documents = load_documents_from_databricks(
        review_id_field="review_id", review_text_fields=("comentario",)
    )
    reviews = [document for document in documents if document["type"] == "review"]
    assert reviews, "The prepared reviews table must produce searchable comments"
    review_ids = [review["review_id"] for review in reviews]
    assert len(review_ids) == len(set(review_ids)), "Each review must have its own identifier"
    assert all(review["review_id"] == review["source"]["row"]["review_id"] for review in reviews)
    product_ids = {
        document["product_id"] for document in documents if document["type"] == "product"
    }
    assert all(review["product_id"] in product_ids for review in reviews)

    query = max(reviews, key=lambda document: len(document["tokens"]))["text"]
    retriever = BM25Retriever(documents, top_k=5)

    def check_results(current_documents):
        results = retriever.search(query)
        assert 1 <= len(results) <= 5
        assert [result["score"] for result in results] == sorted(
            [result["score"] for result in results], reverse=True
        )
        review_results = [result for result in results if result["type"] == "review"]
        assert review_results, "A query taken from a comment must retrieve reviews"
        for result in review_results:
            assert result["review_id"] == result["source"]["row"]["review_id"]
            assert result["source"]["table"] == os.environ["DATABRICKS_REVIEWS_TABLE"].strip()
            assert any(
                document["type"] == "review"
                and result["review_id"] == document["review_id"]
                and result["product_id"] == document["product_id"]
                and result["text"] == document["text"]
                and result["source"] == document["source"]
                for document in current_documents
            )

    check_results(documents)
    refreshed = load_documents_from_databricks(
        review_id_field="review_id", review_text_fields=("comentario",)
    )
    retriever.rebuild(refreshed)
    check_results(refreshed)


def test_product_rating_ranking_real_data():
    if not os.getenv("DATABRICKS_REVIEWS_TABLE") or not os.getenv(
        "DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN"
    ):
        pytest.skip("Configure the prepared reviews table and its product identifier")
    documents = load_documents_from_databricks(
        review_id_field="review_id", review_text_fields=("comentario",)
    )
    retriever = BM25Retriever(documents, top_k=5)
    results = retriever.search("", sort_by_rating=True)
    assert results, "There must be rated catalog products to validate ranking"
    assert len(results) <= 5
    assert [result["average_rating"] for result in results] == sorted(
        [result["average_rating"] for result in results], reverse=True
    )
    records = fetch_reviews(limit=None)
    id_column = os.environ["DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN"].strip()
    for result in results:
        assert result["type"] == "product"
        ratings = [row["nota"] for row in records if row[id_column] == result["product_id"]]
        assert result["average_rating"] == pytest.approx(sum(ratings) / len(ratings))
        assert result["review_count"] == len(ratings)

    query = results[0]["text"]
    filtered = retriever.search(query, sort_by_rating=True)
    assert filtered
    assert all(set(tokenize(query)).intersection(tokenize(result["text"])) for result in filtered)
    assert all(result["review_count"] > 0 for result in filtered)
