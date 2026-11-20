import pytest

from agente_horizonte.retrieval.preprocessing import normalize_text, tokenize


@pytest.mark.parametrize("text", [None, "", " \t\r\n", "...!? _ -", "\u0301"])
def test_empty_text_has_no_tokens(text):
    assert normalize_text(text) == ""
    assert tokenize(text) == []


@pytest.mark.parametrize(
    "text",
    [
        "  AVALIAÇÃO: Ótima!\nCamiseta_AZUL 42. ",
        "avaliac\u0327a\u0303o o\u0301tima camiseta azul 42",
    ],
)
def test_normalizes_case_accents_punctuation_and_whitespace(text):
    assert normalize_text(text) == "avaliacao otima camiseta azul 42"
    assert tokenize(text) == ["avaliacao", "otima", "camiseta", "azul", "42"]


def test_keeps_repeated_words_numbers_and_negation():
    assert tokenize("Não é bom, não! Tamanho 42, 100% algodão.") == [
        "nao",
        "e",
        "bom",
        "nao",
        "tamanho",
        "42",
        "100",
        "algodao",
    ]


def test_query_and_document_use_the_same_tokens():
    document_tokens = tokenize("Tênis ESPORTIVO; tamanho 42")
    assert all(token in document_tokens for token in tokenize("TENIS 42"))
    assert normalize_text(normalize_text("Tênis ESPORTIVO; tamanho 42")) == (
        "tenis esportivo tamanho 42"
    )
