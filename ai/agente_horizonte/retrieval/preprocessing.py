import re
import unicodedata


def normalize_text(text: str | None) -> str:
    """Normalize catalog, review and query text using the same lexical rules."""
    if text is None:
        return ""
    decomposed = unicodedata.normalize("NFKD", text.casefold())
    unaccented = "".join(
        character for character in decomposed if not unicodedata.combining(character)
    )
    return " ".join(re.findall(r"[^\W_]+", unaccented))


def tokenize(text: str | None) -> list[str]:
    """Return BM25 tokens; empty, null or punctuation-only text produces no tokens."""
    return normalize_text(text).split()
