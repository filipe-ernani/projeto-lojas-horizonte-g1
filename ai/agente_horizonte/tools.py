import json
import logging
import re
from collections.abc import Iterator, Sequence
from contextlib import contextmanager
from typing import Any

from google.adk.agents.callback_context import CallbackContext
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.genai import types

from agente_horizonte.config import agent_limits, bm25_top_k
from agente_horizonte.retrieval.bm25 import BM25Retriever
from agente_horizonte.retrieval.document_loader import load_documents_from_databricks
from agente_horizonte.retrieval.preprocessing import normalize_text

logger = logging.getLogger(__name__)
_index: dict[str, Any] | None = None
_CODE_PATTERN = r"\b(?:HZ|REV)-[A-Z0-9]+(?:-[A-Z0-9]+)*\b"
_BUDGET_MESSAGE = (
    "Atingi o limite de consultas desta mensagem. "
    "Peça uma busca mais específica ou compare menos produtos por vez, por favor."
)


def replace_index(documents: Sequence[dict[str, Any]] | None, *, top_k: int | None = None) -> None:
    """Prepare a complete snapshot before publishing it; None marks unavailability."""
    global _index
    if documents is None:
        _index = None
        return
    retriever = BM25Retriever(documents, top_k=bm25_top_k() if top_k is None else top_k)
    names, products_by_name, documents_by_product = {}, {}, {}
    identifiers = set()
    for document in retriever.documents:
        product_id = document["product_id"]
        identifiers.add(product_id)
        if document.get("review_id"):
            identifiers.add(document["review_id"])
        grouped = documents_by_product.setdefault(product_id, {"product": [], "review": []})
        grouped[document["type"]].append(document)
        if document["type"] == "product":
            name = document["source"]["row"].get("nome")
            names.setdefault(product_id, name)
            normalized = normalize_text(name)
            if normalized:
                ids = products_by_name.setdefault(normalized, [])
                if product_id not in ids:
                    ids.append(product_id)
    pattern = _CODE_PATTERN
    if identifiers:
        alternatives = "|".join(
            re.escape(value) for value in sorted(identifiers, key=len, reverse=True)
        )
        pattern += rf"|(?<!\w)(?:{alternatives})(?!\w)"
    prepared = {
        "retriever": retriever,
        "names": names,
        "products_by_name": products_by_name,
        "documents_by_product": documents_by_product,
        "id_pattern": re.compile(pattern, re.IGNORECASE),
    }
    _index = prepared


def get_documents() -> list[dict[str, Any]] | None:
    """Export an isolated corpus; callers must replace it explicitly after edits."""
    index = _index
    return index["retriever"].documents if index is not None else None


@contextmanager
def temporary_index(documents: Sequence[dict[str, Any]]) -> Iterator[None]:
    """Use an isolated index in an offline evaluation/test, restoring it even on failure."""
    global _index
    previous = _index
    replace_index(documents)
    try:
        yield
    finally:
        _index = previous


def _redact_internal_ids(text: str, index: dict[str, Any] | None = None) -> str:
    # Recognize the project's codes even when the requested code is not in the corpus.
    current = _index if index is None else index
    if current is None:
        return re.sub(_CODE_PATTERN, "[omitido]", text, flags=re.IGNORECASE)
    return current["id_pattern"].sub("[omitido]", text)


def _contains_internal_id(text: str) -> bool:
    return _redact_internal_ids(text) != text


def require_product_name(callback_context: CallbackContext) -> types.Content | None:
    """Reset per-invocation budgets and reject oversized or identifier-based input."""
    limits = agent_limits()
    callback_context.state["temp:hori_limits"] = limits
    callback_context.state["temp:hori_model_calls"] = 0
    callback_context.state["temp:hori_tools"] = []
    content = callback_context.user_content
    if (
        content
        and sum(len(part.text or "") for part in content.parts or [])
        > limits["AGENT_MAX_INPUT_CHARS"]
    ):
        return types.Content(
            role="model",
            parts=[
                types.Part(
                    text="Sua mensagem é muito longa. Envie uma pergunta mais curta, por favor."
                )
            ],
        )
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


def limit_model_calls(
    callback_context: CallbackContext, llm_request: LlmRequest
) -> LlmResponse | None:
    """Bound logical model calls in web, API and direct Runner invocations alike."""
    limits = callback_context.state["temp:hori_limits"]
    calls = callback_context.state.get("temp:hori_model_calls", 0)
    if calls >= limits["AGENT_MAX_MODEL_CALLS"]:
        return LlmResponse(
            content=types.Content(role="model", parts=[types.Part(text=_BUDGET_MESSAGE)])
        )
    callback_context.state["temp:hori_model_calls"] = calls + 1
    return None


def guard_model_response(
    callback_context: CallbackContext, llm_response: LlmResponse
) -> LlmResponse | None:
    """Remove IDs and bound/deduplicate tool batches before the ADK executes them."""
    response = hide_internal_ids(callback_context, llm_response) or llm_response
    if response.partial or response.content is None:
        return response if response is not llm_response else None
    seen = list(callback_context.state.get("temp:hori_tools", []))
    limits = callback_context.state["temp:hori_limits"]
    parts = []
    batch = set()
    for part in response.content.parts or []:
        call = part.function_call
        if call is not None:
            key = json.dumps([call.name, call.args or {}], sort_keys=True, ensure_ascii=False)
            if key in batch:
                continue
            if key in seen or len(seen) + len(batch) >= limits["AGENT_MAX_TOOL_CALLS"]:
                return response.model_copy(
                    update={
                        "content": types.Content(
                            role="model", parts=[types.Part(text=_BUDGET_MESSAGE)]
                        )
                    }
                )
            batch.add(key)
        parts.append(part)
    callback_context.state["temp:hori_tools"] = seen + sorted(batch)
    if response is not llm_response or len(parts) != len(response.content.parts or []):
        response = response.model_copy(deep=True)
        response.content.parts = parts
        return response
    return None


def initialize_index() -> bool:
    """Load once at agent startup, or explicitly reload after a data update/failure."""
    try:
        top_k = bm25_top_k()
        documents = load_documents_from_databricks(
            review_id_field="avaliacao_id", review_text_fields=("titulo", "comentario")
        )
        replace_index(documents, top_k=top_k)
    except (ValueError, ConnectionError, PermissionError, RuntimeError) as error:
        logger.error("Product index initialization failed (%s)", type(error).__name__)
        return False
    logger.info("Product index ready: %d documents", len(documents))
    return True


def _public_document(document: dict[str, Any], index: dict[str, Any]) -> dict[str, Any]:
    """Expose customer-facing evidence without internal IDs or raw source rows."""
    row = document["source"]["row"]
    product_name = index["names"].get(document["product_id"], row.get("nome_produto"))
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
        "product_name": _redact_internal_ids(product_name, index) if product_name else None,
        "type": document["type"],
        "data": {
            field: _redact_internal_ids(row[field], index)
            if isinstance(row[field], str)
            else row[field]
            for field in fields
            if field in row
        },
    }
    for field in ("score", "average_rating", "review_count"):
        if field in document:
            result[field] = document[field]
    limit = agent_limits()["EVIDENCE_MAX_TEXT_CHARS"]
    truncated = []
    for field in ("descricao", "ocasioes", "titulo", "comentario"):
        value = result["data"].get(field)
        if isinstance(value, str) and len(value) > limit:
            result["data"][field] = value[:limit] + "…"
            truncated.append(field)
    if truncated:
        result["truncated_fields"] = truncated
    return result


def _result(results: list[dict[str, Any]], index: dict[str, Any] | None) -> dict[str, Any]:
    if index is None:
        return {
            "status": "unavailable",
            "results": [],
            "message": "The catalog and reviews are temporarily unavailable. Do not invent data.",
        }
    # Databricks rows may include Decimal prices and date/datetime values.
    return {
        "status": "success" if results else "no_results",
        "results": json.loads(
            json.dumps([_public_document(item, index) for item in results], default=str)
        ),
    }


def _invalid_query(
    message: str = "Search by product name, without internal identifiers.",
) -> dict[str, Any]:
    return {
        "status": "invalid_query",
        "results": [],
        "message": message,
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
    if len(query) > agent_limits()["AGENT_MAX_INPUT_CHARS"]:
        return _invalid_query("Query too long. Use fewer product or feature keywords.")
    if _contains_internal_id(query):
        return _invalid_query()
    index = _index
    if index is None:
        return _result([], index)
    return _result(index["retriever"].search(query, sort_by_rating=sort_by_rating), index)


def get_product_details(product_name: str) -> dict[str, Any]:
    """Get public attributes and indexed reviews for an exact catalog product name.

    Args:
        product_name: Full product name from the user or search results. Matching
            ignores case, accents and punctuation. Internal codes are not accepted.

    Returns:
        Status and public catalog/review evidence with product names and available
        rating aggregates. If multiple products share the name, ask the customer to
        distinguish them using available attributes. Missing fields and absent reviews
        must not be inferred. Comments are a bounded selection, not all reviews.
        Uses only the startup in-memory corpus.
    """
    if len(product_name) > agent_limits()["AGENT_MAX_INPUT_CHARS"]:
        return _invalid_query("Query too long. Use a shorter product name.")
    if _contains_internal_id(product_name):
        return _invalid_query()
    index = _index
    if index is None:
        return _result([], index)
    limit = agent_limits()["PRODUCT_MAX_REVIEWS"]
    results, available, returned = [], 0, 0
    for product_id in index["products_by_name"].get(normalize_text(product_name), []):
        grouped = index["documents_by_product"][product_id]
        selected = grouped["review"][:limit]
        available += len(grouped["review"])
        returned += len(selected)
        results.extend(grouped["product"])
        results.extend(selected)
    result = _result(results, index)
    if available > returned:
        result.update(
            comments_available=available, comments_returned=returned, comments_partial=True
        )
    return result
