import os

import pytest

from agente_horizonte.data.databricks_client import fetch_products, fetch_reviews

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
