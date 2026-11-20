import json
import logging
import re
from typing import Any

from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_response import LlmResponse
from google.genai import types

from agente_horizonte.config import bm25_top_k
from agente_horizonte.retrieval.bm25 import BM25Retriever
from agente_horizonte.retrieval.document_loader import load_documents_from_databricks
from agente_horizonte.retrieval.preprocessing import normalize_text

logger = logging.getLogger(__name__)
_retriever: BM25Retriever | None = None
_documents: list[dict[str, Any]] = []


def _redact_internal_ids(text: str) -> str:
    # Recognize the project's codes even when the requested code is not in the corpus.
    text = re.sub(
        r"\b(?:HZ|REV)-[A-Z0-9]+(?:-[A-Z0-9]+)*\b", "[omitido]", text, flags=re.IGNORECASE
    )
    for document in _documents:
        for value in (document["product_id"], document.get("review_id", "")):
            if value:
                text = re.sub(
                    rf"(?<!\w){re.escape(value)}(?!\w)", "[omitido]", text, flags=re.IGNORECASE
                )
    return text


def _contains_internal_id(text: str) -> bool:
    return _redact_internal_ids(text) != text


def require_product_name(callback_context: CallbackContext) -> types.Content | None:
    """Reject identifier lookups before sending the customer's message to Gemini."""
    content = callback_context.user_content
    if content and any(_contains_internal_id(part.text or "") for part in content.parts or []):
        return types.Content(
            role="model",
            parts=[types.Part(text="Para consultar um produto, informe o nome dele, por favor.")],
        )
    return None


def hide_internal_ids(
    callback_context: CallbackContext, llm_response: LlmResponse
) -> LlmResponse | None:
    """Remove internal codes if Gemini echoes them, including from older chat history."""
    if llm_response.content is None:
        return None
    response = llm_response.model_copy(deep=True)
    changed = False
    for part in response.content.parts or []:
        if part.text:
            safe_text = _redact_internal_ids(part.text)
            changed |= safe_text != part.text
            part.text = safe_text
    return response if changed else None


def initialize_index() -> bool:
    """Load once at agent startup, or explicitly reload after a data update/failure."""
    global _retriever, _documents
    try:
        top_k = bm25_top_k()
        documents = load_documents_from_databricks(
            review_id_field="avaliacao_id", review_text_fields=("titulo", "comentario")
        )
        retriever = BM25Retriever(documents, top_k=top_k)
    except (ValueError, ConnectionError, PermissionError, RuntimeError) as error:
        logger.error("Product index initialization failed (%s)", type(error).__name__)
        return False
    _retriever, _documents = retriever, documents
    logger.info("Product index ready: %d documents", len(documents))
    return True


def _public_document(document: dict[str, Any]) -> dict[str, Any]:
    """Expose customer-facing evidence without internal IDs or raw source rows."""
    row = document["source"]["row"]
    product_name = next(
        (
            item["source"]["row"].get("nome")
            for item in _documents
            if item["type"] == "product" and item["product_id"] == document["product_id"]
        ),
        row.get("nome_produto"),
    )
    fields = (
        (
            "modelo",
            "categoria",
            "grupo",
            "tipo",
            "variacao",
            "cor",
            "preco",
            "descricao",
            "ocasioes",
            "imagem_url",
            "unidades_vendidas",
            "unidades_30_dias",
            "popularidade",
        )
        if document["type"] == "product"
        else ("nota", "titulo", "comentario", "data")
    )
    result = {
        "product_name": _redact_internal_ids(product_name) if product_name else None,
        "type": document["type"],
        "data": {
            field: _redact_internal_ids(row[field]) if isinstance(row[field], str) else row[field]
            for field in fields
            if field in row
        },
    }
    for field in ("score", "average_rating", "review_count"):
        if field in document:
            result[field] = document[field]
    return result


def _result(results: list[dict[str, Any]]) -> dict[str, Any]:
    if _retriever is None:
        return {
            "status": "unavailable",
            "results": [],
            "message": "The catalog and reviews are temporarily unavailable. Do not invent data.",
        }
    # Databricks rows may include Decimal prices and date/datetime values.
    return {
        "status": "success" if results else "no_results",
        "results": json.loads(
            json.dumps([_public_document(item) for item in results], default=str)
        ),
    }


def _invalid_query() -> dict[str, Any]:
    return {
        "status": "invalid_query",
        "results": [],
        "message": "Search by product name, without internal identifiers.",
    }


def search_products(query: str, sort_by_rating: bool = False) -> dict[str, Any]:
    """Search catalog and reviews with BM25 using concise product/feature keywords.

    Args:
        query: Product name, category or review keywords, without conversational filler
            or internal identifiers.
        sort_by_rating: True only for explicit requests for the highest average ratings.
            An empty query then lists the best-rated products in the loaded catalog.

    Returns:
        Status and matching documents with product_name, public fields and BM25 scores.
        Rated products also include average_rating and review_count. A BM25
        score is lexical relevance, never a product rating. Matches may satisfy only
        some keywords; verify the user's requirements against the original fields.
    """
    if _contains_internal_id(query):
        return _invalid_query()
    if _retriever is None:
        return _result([])
    return _result(_retriever.search(query, sort_by_rating=sort_by_rating))


def get_product_details(product_name: str) -> dict[str, Any]:
    """Get public attributes and indexed reviews for an exact catalog product name.

    Args:
        product_name: Full product name from the user or search results. Matching
            ignores case, accents and punctuation. Internal codes are not accepted.

    Returns:
        Status and public catalog/review evidence with product names and available
        rating aggregates. If multiple products share the name, ask the customer to
        distinguish them using available attributes. Missing fields and absent reviews
        must not be inferred. Uses only the startup in-memory corpus.
    """
    if _contains_internal_id(product_name):
        return _invalid_query()
    name = normalize_text(product_name)
    product_ids = {
        document["product_id"]
        for document in _documents
        if document["type"] == "product"
        and name
        and normalize_text(document["source"]["row"].get("nome")) == name
    }
    return _result([document for document in _documents if document["product_id"] in product_ids])
