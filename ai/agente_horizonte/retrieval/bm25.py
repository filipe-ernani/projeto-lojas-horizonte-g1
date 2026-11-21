from collections.abc import Sequence
from copy import deepcopy
from typing import Any

from rank_bm25 import BM25Okapi

from agente_horizonte.retrieval.preprocessing import tokenize


def _validate_top_k(top_k: int) -> None:
    if type(top_k) is not int or top_k < 1:
        raise ValueError("top_k must be a positive integer")


class BM25Retriever:
    """Keep a processed corpus and its Okapi BM25 index in memory, without external I/O."""

    def __init__(self, documents: Sequence[dict[str, Any]], *, top_k: int = 5) -> None:
        _validate_top_k(top_k)
        self._top_k = top_k
        self.rebuild(documents)

    def rebuild(self, documents: Sequence[dict[str, Any]]) -> None:
        """Replace the corpus only after the new index has been built successfully."""
        prepared = deepcopy([document for document in documents if document["tokens"]])
        index = BM25Okapi([document["tokens"] for document in prepared]) if prepared else None
        self._documents = prepared
        self._index = index

    @property
    def documents(self) -> list[dict[str, Any]]:
        """Return an isolated corpus for inspection or an explicit replacement."""
        return deepcopy(self._documents)

    def search(
        self, query: str, *, top_k: int | None = None, sort_by_rating: bool = False
    ) -> list[dict[str, Any]]:
        limit = self._top_k if top_k is None else top_k
        _validate_top_k(limit)
        tokens = tokenize(query)
        if self._index is None or (not tokens and not sort_by_rating):
            return []

        scores = self._index.get_scores(tokens)
        # Matching terms can have zero or negative IDF, especially in small corpora.
        matches = (
            position
            for position, frequencies in enumerate(self._index.doc_freqs)
            if not tokens or any(token in frequencies for token in tokens)
        )
        if sort_by_rating:
            matches = (
                position
                for position in matches
                if self._documents[position]["type"] == "product"
                and self._documents[position].get("average_rating") is not None
            )
        ranked = sorted(
            matches,
            key=lambda position: (
                self._documents[position]["average_rating"] if sort_by_rating else 0,
                scores[position],
            ),
            reverse=True,
        )[:limit]
        results = []
        for position in ranked:
            document = self._documents[position]
            result = {
                "product_id": document["product_id"],
                "type": document["type"],
                "text": document["text"],
                "source": deepcopy(document["source"]),
                "score": float(scores[position]),
            }
            if "review_id" in document:
                result["review_id"] = document["review_id"]
            if "average_rating" in document:
                result["average_rating"] = document["average_rating"]
                result["review_count"] = document["review_count"]
            results.append(result)
        return results
