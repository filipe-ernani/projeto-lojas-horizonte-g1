from collections.abc import Sequence
from typing import Any

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


def build_review_documents(
    reviews: Sequence[dict[str, Any]],
    *,
    source: str,
    product_id_field: str,
    review_id_field: str,
    text_fields: Sequence[str],
) -> list[dict[str, Any]]:
    """Prepare explicitly linked reviews; column names require a confirmed data contract.

    No order-to-product association is inferred. Reviews without an identifier, a
    scalar SKU or textual content are omitted, as are conflicting product links
    for the same review identifier in this batch.
    """
    product_links: dict[str, set[str | None]] = {}
    for row in reviews:
        review_id = _identifier(row.get(review_id_field))
        if review_id is not None:
            product_links.setdefault(review_id, set()).add(_identifier(row.get(product_id_field)))

    documents = []
    for row in reviews:
        review_id = _identifier(row.get(review_id_field))
        product_id = _identifier(row.get(product_id_field))
        if review_id is None or product_id is None or len(product_links[review_id]) != 1:
            continue
        document = _document(row, product_id, text_fields, source, "review")
        if document is not None:
            documents.append(document)
    return documents
