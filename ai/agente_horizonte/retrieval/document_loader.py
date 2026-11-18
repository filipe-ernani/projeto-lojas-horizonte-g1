from collections.abc import Sequence
from math import isfinite
from typing import Any

from agente_horizonte.config import catalog_identifiers, reviews_identifiers
from agente_horizonte.data.databricks_client import fetch_products, fetch_reviews
from agente_horizonte.retrieval.preprocessing import normalize_text


def _identifier(value: Any) -> str | None:
    # SKU values are strings in the current catalog. Never normalize identifiers.
    return value if isinstance(value, str) and value.strip() else None


def _document(
    row: dict[str, Any],
    product_id: str,
    text_fields: Sequence[str],
    source: str,
    document_type: str,
) -> dict[str, Any] | None:
    text = normalize_text(
        " ".join(row[field] for field in text_fields if isinstance(row.get(field), str))
    )
    if not text:
        return None
    return {
        "product_id": product_id,
        "type": document_type,
        "text": text,
        "tokens": text.split(),
        "source": {"table": source, "row": row.copy()},
    }


def build_product_documents(
    products: Sequence[dict[str, Any]],
    *,
    source: str,
    product_id_field: str = "sku",
) -> list[dict[str, Any]]:
    """Prepare current catalog rows without querying Databricks or changing the input."""
    documents = []
    for row in products:
        product_id = _identifier(row.get(product_id_field))
        if product_id is None:
            continue
        document = _document(
            row, product_id, ("nome", "modelo", "categoria", "grupo"), source, "product"
        )
        if document is not None:
            documents.append(document)
    return documents


def _valid_review_rows(
    reviews: Sequence[dict[str, Any]],
    *,
    product_id_field: str,
    review_id_field: str | None,
) -> list[dict[str, Any]]:
    product_links: dict[str, set[str | None]] = {}
    if review_id_field is not None:
        for row in reviews:
            review_id = _identifier(row.get(review_id_field))
            if review_id is not None:
                product_links.setdefault(review_id, set()).add(
                    _identifier(row.get(product_id_field))
                )

    valid_rows = []
    for row in reviews:
        product_id = _identifier(row.get(product_id_field))
        if product_id is None:
            continue
        if review_id_field is not None:
            review_id = _identifier(row.get(review_id_field))
            if review_id is None or len(product_links[review_id]) != 1:
                continue
        valid_rows.append(row)
    return valid_rows


def build_review_documents(
    reviews: Sequence[dict[str, Any]],
    *,
    source: str,
    product_id_field: str,
    review_id_field: str | None,
    text_fields: Sequence[str],
) -> list[dict[str, Any]]:
    """Prepare explicitly linked reviews, preserving original IDs and source rows.

    Missing IDs, ambiguous product links and comments without text are omitted.
    Pass review_id_field=None explicitly when the source has no review ID.
    """
    documents = []
    for row in _valid_review_rows(
        reviews, product_id_field=product_id_field, review_id_field=review_id_field
    ):
        product_id = row[product_id_field]
        document = _document(row, product_id, text_fields, source, "review")
        if document is not None:
            if review_id_field is not None:
                document["review_id"] = row[review_id_field]
            documents.append(document)
    return documents


def load_documents_from_databricks(
    *,
    review_id_field: str | None = None,
    review_text_fields: Sequence[str] = (),
) -> list[dict[str, Any]]:
    """Load the complete catalog; include reviews when their text fields are supplied.

    Call at startup or for an explicit rebuild, never for each user query.
    Errors propagate to the caller, leaving any existing retriever unchanged.
    """
    if review_id_field is not None and (not review_id_field.strip() or not review_text_fields):
        raise ValueError("Provide review_text_fields and a non-empty review_id_field when set")

    table, product_id, _ = catalog_identifiers()
    review_identifiers = reviews_identifiers() if review_text_fields else None
    # SQL identifiers have already been validated; document metadata uses unquoted names.
    documents = build_product_documents(
        fetch_products(limit=None),
        source=table.replace("`", ""),
        product_id_field=product_id.strip("`"),
    )
    if review_identifiers is not None:
        review_table, review_product_id = review_identifiers
        review_product_id = review_product_id.strip("`")
        reviews = _valid_review_rows(
            fetch_reviews(limit=None),
            product_id_field=review_product_id,
            review_id_field=review_id_field,
        )
        ratings_by_product: dict[str, list[float]] = {}
        seen_ids: set[str] = set()
        for row in reviews:
            rating = row.get("nota")
            if type(rating) not in (int, float) or not isfinite(rating) or not 1 <= rating <= 5:
                continue
            if review_id_field is not None:
                review_id = row[review_id_field]
                if review_id in seen_ids:
                    continue
                seen_ids.add(review_id)
            ratings_by_product.setdefault(row[review_product_id], []).append(float(rating))
        for document in documents:
            ratings = ratings_by_product.get(document["product_id"], [])
            document["average_rating"] = sum(ratings) / len(ratings) if ratings else None
            document["review_count"] = len(ratings)
        documents.extend(
            build_review_documents(
                reviews,
                source=review_table.replace("`", ""),
                product_id_field=review_product_id,
                review_id_field=review_id_field,
                text_fields=review_text_fields,
            )
        )
    return documents
