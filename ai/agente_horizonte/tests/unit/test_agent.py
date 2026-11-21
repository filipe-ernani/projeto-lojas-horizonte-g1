import asyncio
import importlib
import json
import sys
from datetime import date
from decimal import Decimal
from unittest.mock import Mock

import pytest
from google.adk.models.google_llm import Gemini
from google.adk.models.llm_response import LlmResponse
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

from agente_horizonte import tools
from agente_horizonte.retrieval.document_loader import (
    build_product_documents,
    build_review_documents,
)


@pytest.fixture
def documents():
    products = build_product_documents(
        [
            {"sku": "HZ-001", "nome": "Tênis azul", "preco": Decimal("99.90")},
            {"sku": "HZ-002", "nome": "Tênis vermelho", "preco": Decimal("149.90")},
            {"sku": "HZ-003", "nome": "Mochila escolar"},
        ],
        source="test.default.catalog",
    )
    for product, rating in zip(products, (5.0, 3.0, None), strict=True):
        product.update(average_rating=rating, review_count=1 if rating else 0)
    return products + build_review_documents(
        [
            {
                "avaliacao_id": "REV-1",
                "sku": "HZ-001",
                "nota": 5,
                "comentario": "Macio e confortável",
                "titulo": "Excelente",
                "data": date(2026, 11, 18),
            }
        ],
        source="test.default.reviews",
        product_id_field="sku",
        review_id_field="avaliacao_id",
        text_fields=("titulo", "comentario"),
    )


@pytest.fixture
def initialized_tools(monkeypatch, documents):
    monkeypatch.setattr(tools, "_index", None)
    monkeypatch.setenv("BM25_TOP_K", "5")
    loader = Mock(return_value=documents)
    monkeypatch.setattr(tools, "load_documents_from_databricks", loader)
    assert tools.initialize_index()
    return loader


def assert_no_internal_ids(value):
    serialized = json.dumps(value, ensure_ascii=False).lower()
    for internal in (
        "product_id",
        "review_id",
        "avaliacao_id",
        '"sku"',
        "hz-001",
        "hz-002",
        "hz-003",
        "rev-1",
    ):
        assert internal not in serialized


def test_search_and_product_name_lookup_use_one_startup_load(initialized_tools):
    products = tools.search_products("tênis")
    review = tools.search_products("confortável")["results"][0]
    details = tools.get_product_details("Tênis azul")

    assert products["status"] == "success"
    assert {item["product_name"] for item in products["results"]} == {
        "Tênis azul",
        "Tênis vermelho",
    }
    assert all(isinstance(item["score"], float) for item in products["results"])
    assert review["product_name"] == "Tênis azul"
    assert review["data"]["data"] == "2026-11-18"
    assert review["data"]["titulo"] == "Excelente"
    assert details["results"][0]["data"]["preco"] == "99.90"
    assert {item["type"] for item in details["results"]} == {"product", "review"}
    assert all("tokens" not in item for item in details["results"])
    json.dumps(details)
    for result in (products, review, details):
        assert_no_internal_ids(result)
    initialized_tools.assert_called_once_with(
        review_id_field="avaliacao_id", review_text_fields=("titulo", "comentario")
    )


def test_rating_search_returns_product_means_and_counts(initialized_tools):
    results = tools.search_products("tênis", sort_by_rating=True)["results"]
    assert [item["product_name"] for item in results] == ["Tênis azul", "Tênis vermelho"]
    assert [item["average_rating"] for item in results] == [5, 3]
    assert all(item["review_count"] == 1 for item in results)
    assert tools.search_products("", sort_by_rating=True)["results"] == results


def test_gold_catalog_search_and_details_work_without_review_table(monkeypatch):
    row = {
        "sku": "HZ-001",
        "nome": "Peça de teste",
        "modelo": "Feminino",
        "categoria": "Moda",
        "grupo": "Vestuário",
        "tipo": "Regata",
        "variacao": "Linho",
        "cor": "Lilás",
        "preco": Decimal("89.90"),
        "descricao": "Tecido respirável.",
        "ocasioes": "festa;casamento",
        "imagem_url": "https://example.com/imagem.jpg",
        "nota_media": Decimal("4.75"),
        "qtd_avaliacoes": 20,
        "unidades_vendidas": 300,
        "unidades_30_dias": 25,
        "custo": 10,
    }
    for name, value in {
        "DATABRICKS_CATALOG_TABLE": "horizonte.gold.gold_catalogo",
        "DATABRICKS_CATALOG_PRODUCT_ID_COLUMN": "sku",
        "DATABRICKS_CATALOG_CATEGORY_COLUMN": "categoria",
        "DATABRICKS_REVIEWS_TABLE": "",
        "DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN": "",
        "BM25_TOP_K": "5",
    }.items():
        monkeypatch.setenv(name, value)
    monkeypatch.setattr(tools, "_index", None)
    products, reviews = Mock(return_value=[row]), Mock()
    monkeypatch.setattr("agente_horizonte.retrieval.document_loader.fetch_products", products)
    monkeypatch.setattr("agente_horizonte.retrieval.document_loader.fetch_reviews", reviews)

    assert tools.initialize_index()
    details = tools.get_product_details("Peça de teste")
    assert details["status"] == "success"
    assert len(details["results"]) == 1
    product = details["results"][0]
    assert product["average_rating"] == 4.75
    assert product["review_count"] == 20
    assert product["data"] == {
        key: str(value) if isinstance(value, Decimal) else value
        for key, value in row.items()
        if key not in {"sku", "nome", "nota_media", "qtd_avaliacoes", "custo"}
    }
    for query in ("regata", "linho", "lilás", "respirável", "casamento"):
        assert tools.search_products(query)["results"][0]["product_name"] == "Peça de teste"
    assert tools.search_products("", sort_by_rating=True)["results"][0]["average_rating"] == 4.75
    assert_no_internal_ids(details)
    products.assert_called_once_with(limit=None)
    reviews.assert_not_called()


def test_search_respects_configured_top_k(initialized_tools, monkeypatch):
    monkeypatch.setenv("BM25_TOP_K", "1")
    assert tools.initialize_index()
    assert len(tools.search_products("tênis")["results"]) == 1
    # Name lookup still includes its review, independently of BM25 Top-K.
    assert len(tools.get_product_details("Tênis azul")["results"]) == 2


@pytest.mark.parametrize("query", ["", "...", "geladeirainexistente"])
def test_no_results_are_explicit(initialized_tools, query):
    assert tools.search_products(query) == {"status": "no_results", "results": []}


def test_name_lookup_ignores_accents_case_and_punctuation(initialized_tools):
    assert tools.get_product_details("  TENIS AZUL! ") == tools.get_product_details("Tênis azul")
    assert tools.get_product_details("Mochila escolar")["results"][0]["review_count"] == 0


@pytest.mark.parametrize("name", ["", "...", "Tênis", "Produto inexistente"])
def test_missing_or_partial_name_does_not_invent_products(initialized_tools, name):
    assert tools.get_product_details(name) == {"status": "no_results", "results": []}


@pytest.mark.parametrize("query", ["HZ-001", "hz-001", "HZ-XYZ-999999", "tênis HZ-001", "REV-1"])
def test_tools_reject_internal_identifier_queries(initialized_tools, query):
    for result in (tools.search_products(query), tools.get_product_details(query)):
        assert result["status"] == "invalid_query"
        assert result["results"] == []
        assert_no_internal_ids(result)


def test_ids_are_removed_from_comment_text_and_raw_metadata(initialized_tools):
    documents = tools.get_documents()
    documents[-1]["source"]["row"]["comentario"] = "Confortável. HZ-001, REV-1."
    documents[-1]["source"]["row"]["metadata"] = {"review_id": "REV-1", "sku": "HZ-001"}
    tools.replace_index(documents)
    result = tools.get_product_details("Tênis azul")
    assert result["results"][1]["data"]["comentario"] == "Confortável. [omitido], [omitido]."
    assert_no_internal_ids(result)


def test_duplicate_names_keep_internal_review_links(initialized_tools):
    documents = tools.get_documents()
    documents[1]["source"]["row"]["nome"] = "Tênis azul"
    tools.replace_index(documents)
    result = tools.get_product_details("Tênis azul")
    assert len(result["results"]) == 3
    assert [item["average_rating"] for item in result["results"] if item["type"] == "product"] == [
        5,
        3,
    ]
    assert sum(item["type"] == "review" for item in result["results"]) == 1
    assert_no_internal_ids(result)


@pytest.mark.parametrize("error", [ValueError, ConnectionError, PermissionError, RuntimeError])
def test_initial_load_failure_is_controlled(monkeypatch, caplog, error):
    monkeypatch.setattr(tools, "_index", None)
    monkeypatch.setattr(
        tools, "load_documents_from_databricks", Mock(side_effect=error("private credentials"))
    )
    assert not tools.initialize_index()
    assert tools.search_products("tênis")["status"] == "unavailable"
    assert tools.get_product_details("Tênis azul")["status"] == "unavailable"
    assert "private credentials" not in caplog.text


def test_explicit_reload_preserves_previous_index_on_failure(initialized_tools):
    initialized_tools.side_effect = ConnectionError("warehouse unavailable")
    assert not tools.initialize_index()
    assert tools.search_products("tênis")["status"] == "success"
    assert tools.get_product_details("Tênis azul")["status"] == "success"


def test_successful_empty_load_clears_index(initialized_tools):
    initialized_tools.return_value = []
    assert tools.initialize_index()
    assert tools.search_products("tênis")["status"] == "no_results"
    assert tools.get_product_details("Tênis azul")["status"] == "no_results"


@pytest.fixture
def agent(monkeypatch, initialized_tools):
    monkeypatch.setenv("GOOGLE_API_KEY", "unit-test-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-primary")
    monkeypatch.setenv("GEMINI_MODEL_FALLBACK_1", "gemini-secondary")
    monkeypatch.setenv("GEMINI_MODEL_FALLBACK_2", "gemini-tertiary")
    monkeypatch.setenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE")
    monkeypatch.setenv("GEMINI_MAX_ATTEMPTS_PER_MODEL", "1")
    sys.modules.pop("agente_horizonte.agent", None)
    module = importlib.import_module("agente_horizonte.agent")
    yield module.root_agent
    sys.modules.pop("agente_horizonte.agent", None)


def test_agent_configuration_and_adk_discovery(agent):
    from google.adk.cli.utils.agent_loader import AgentLoader

    assert AgentLoader(agents_dir=".").load_agent("agente_horizonte") is agent
    assert agent.sub_agents == []
    assert agent.tools == [tools.search_products, tools.get_product_details]
    assert agent.before_agent_callback is tools.require_product_name
    assert agent.before_model_callback is tools.limit_model_calls
    assert agent.after_model_callback is tools.guard_model_response
    assert agent.generate_content_config.max_output_tokens == 1024
    assert [model.model for model in agent.model.models] == [
        "gemini-primary",
        "gemini-secondary",
        "gemini-tertiary",
    ]
    assert all(model.retry_options.attempts == 1 for model in agent.model.models)
    assert agent.generate_content_config.http_options.timeout == 30_000


@pytest.mark.parametrize(
    ("message", "calls", "expected_status", "expected_names"),
    [
        (
            "O que dizem as avaliações do Tênis azul?",
            [("get_product_details", {"product_name": "Tênis azul"})],
            "success",
            {"Tênis azul"},
        ),
        (
            "Recomende tênis com as maiores notas",
            [("search_products", {"query": "tênis", "sort_by_rating": True})],
            "success",
            {"Tênis azul", "Tênis vermelho"},
        ),
        (
            "Compare Tênis azul e Tênis vermelho",
            [
                ("get_product_details", {"product_name": "Tênis azul"}),
                ("get_product_details", {"product_name": "Tênis vermelho"}),
            ],
            "success",
            {"Tênis azul", "Tênis vermelho"},
        ),
        (
            "Há geladeirainexistente?",
            [("search_products", {"query": "geladeirainexistente"})],
            "no_results",
            set(),
        ),
        (
            "Busque tênis",
            [("search_products", {"query": "tênis"})],
            "unavailable",
            set(),
        ),
    ],
)
def test_adk_runner_passes_real_tool_evidence_to_mocked_gemini(
    agent, monkeypatch, message, calls, expected_status, expected_names
):
    requests = []
    if expected_status == "unavailable":
        monkeypatch.setattr(tools, "_index", None)

    async def fake_generate(self, llm_request, stream=False):
        requests.append(llm_request)
        if len(requests) == 1:
            parts = [
                types.Part(function_call=types.FunctionCall(name=name, args=args))
                for name, args in calls
            ]
        else:
            # Deliberately echo codes to exercise the output callback with the real Runner.
            parts = [types.Part(text="Mocked answer: HZ-001, REV-1. Not a real Gemini validation.")]
        yield LlmResponse(content=types.Content(role="model", parts=parts))

    monkeypatch.setattr(Gemini, "generate_content_async", fake_generate)

    async def run():
        sessions = InMemorySessionService()
        session = await sessions.create_session(app_name="test", user_id="customer")
        runner = Runner(agent=agent, app_name="test", session_service=sessions)
        return [
            event
            async for event in runner.run_async(
                user_id="customer",
                session_id=session.id,
                new_message=types.Content(role="user", parts=[types.Part(text=message)]),
            )
        ]

    events = asyncio.run(run())
    responses = [
        response.response for event in events for response in event.get_function_responses()
    ]
    assert len(responses) == len(calls)
    assert all(response["status"] == expected_status for response in responses)
    assert {
        item["product_name"] for response in responses for item in response["results"]
    } == expected_names
    for response in responses:
        assert_no_internal_ids(response)
    assert len(requests) == 2
    assert "GROUNDING AND TOOL USE" in str(requests[0].config.system_instruction)
    assert "full catalog name for EVERY recommended product" in str(
        requests[0].config.system_instruction
    )
    # Only public evidence may reach the next model request.
    model_evidence = [
        part.function_response.response
        for content in requests[1].contents
        for part in content.parts or []
        if part.function_response
    ]
    assert model_evidence == responses
    final_text = " ".join(
        part.text
        for event in events
        if event.content
        for part in event.content.parts or []
        if part.text
    )
    assert "[omitido]" in final_text
    assert_no_internal_ids(final_text)


@pytest.mark.parametrize("message", ["Busque HZ-001", "Compare HZ-001 e HZ-002", "Consulte REV-1"])
def test_identifier_queries_are_blocked_before_gemini(agent, monkeypatch, message):
    generate = Mock(side_effect=AssertionError("Identifier queries must not reach Gemini"))
    monkeypatch.setattr(Gemini, "generate_content_async", generate)

    async def run():
        sessions = InMemorySessionService()
        session = await sessions.create_session(app_name="test", user_id="customer")
        runner = Runner(agent=agent, app_name="test", session_service=sessions)
        return [
            event
            async for event in runner.run_async(
                user_id="customer",
                session_id=session.id,
                new_message=types.Content(role="user", parts=[types.Part(text=message)]),
            )
        ]

    events = asyncio.run(run())
    assert not any(event.get_function_calls() for event in events)
    text = " ".join(
        part.text
        for event in events
        if event.content
        for part in event.content.parts or []
        if part.text
    )
    assert "informe o nome" in text
    assert_no_internal_ids(text)
    generate.assert_not_called()


def test_index_export_is_isolated_and_replacement_updates_search_and_details(initialized_tools):
    documents = tools.get_documents()
    documents[0]["source"]["row"]["nome"] = "Produto novo"
    documents[0]["text"] = "produto novo"
    documents[0]["tokens"] = ["produto", "novo"]
    assert tools.get_product_details("Tênis azul")["status"] == "success"
    tools.replace_index(documents)
    assert tools.get_product_details("Tênis azul")["status"] == "no_results"
    assert tools.get_product_details("Produto novo")["results"][0]["product_name"] == "Produto novo"
    assert tools.search_products("novo")["results"][0]["product_name"] == "Produto novo"


def test_failed_snapshot_build_preserves_all_previous_lookups(initialized_tools, monkeypatch):
    before = tools.get_product_details("Tênis azul")
    with pytest.raises(RuntimeError, match="pattern failure"):
        with monkeypatch.context() as scoped:
            scoped.setattr(tools.re, "compile", Mock(side_effect=RuntimeError("pattern failure")))
            tools.replace_index(tools.get_documents())
    assert tools.get_product_details("Tênis azul") == before


def test_comments_are_bounded_without_changing_total_ratings(initialized_tools, monkeypatch):
    documents = tools.get_documents()
    documents[0].update(average_rating=4.5, review_count=100)
    for number in range(10):
        documents += build_review_documents(
            [{"sku": "HZ-001", "review_id": f"comment-{number}", "comentario": "Bom"}],
            source="test.reviews",
            product_id_field="sku",
            review_id_field="review_id",
            text_fields=("comentario",),
        )
    tools.replace_index(documents)
    monkeypatch.setenv("PRODUCT_MAX_REVIEWS", "2")
    result = tools.get_product_details("Tênis azul")
    assert result["comments_available"] == 11
    assert result["comments_returned"] == 2
    assert result["comments_partial"] is True
    assert sum(item["type"] == "review" for item in result["results"]) == 2
    assert result["results"][0]["review_count"] == 100
    assert result["results"][0]["average_rating"] == 4.5


def test_long_evidence_is_marked_and_ids_are_redacted_before_truncation(
    initialized_tools, monkeypatch
):
    documents = tools.get_documents()
    documents[-1]["source"]["row"]["comentario"] = "HZ-001 " + "bom " * 100
    tools.replace_index(documents)
    monkeypatch.setenv("EVIDENCE_MAX_TEXT_CHARS", "30")
    review = tools.get_product_details("Tênis azul")["results"][1]
    assert review["truncated_fields"] == ["comentario"]
    assert review["data"]["comentario"].startswith("[omitido]")
    assert len(review["data"]["comentario"]) == 31


def test_name_lookup_normalizes_only_the_query(initialized_tools, monkeypatch):
    normalize = Mock(wraps=tools.normalize_text)
    monkeypatch.setattr(tools, "normalize_text", normalize)
    assert tools.get_product_details("TENIS AZUL")["status"] == "success"
    normalize.assert_called_once_with("TENIS AZUL")


@pytest.mark.parametrize("value", ["0", "-1", "1.5", "abc", "20001"])
def test_invalid_input_budget_is_rejected(monkeypatch, value):
    from agente_horizonte.config import agent_limits

    monkeypatch.setenv("AGENT_MAX_INPUT_CHARS", value)
    with pytest.raises(ValueError, match="AGENT_MAX_INPUT_CHARS"):
        agent_limits()


def test_temporary_index_restores_exact_previous_state_after_error(initialized_tools):
    before = tools.get_product_details("Tênis azul")
    with pytest.raises(RuntimeError, match="probe failed"), tools.temporary_index([]):
        assert tools.get_product_details("Tênis azul")["status"] == "no_results"
        raise RuntimeError("probe failed")
    assert tools.get_product_details("Tênis azul") == before
