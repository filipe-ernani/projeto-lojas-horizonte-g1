import asyncio
import importlib
import json
import sys
from unittest.mock import Mock

import pytest
from google.adk.models.google_llm import Gemini
from google.adk.models.llm_response import LlmResponse
from google.genai import types

from agente_horizonte import tools
from agente_horizonte.retrieval.document_loader import (
    build_product_documents,
    build_review_documents,
)


@pytest.fixture
def evaluation(monkeypatch, tmp_path):
    monkeypatch.setenv("GOOGLE_API_KEY", "unit-test-key")
    monkeypatch.setenv("GOOGLE_GENAI_USE_VERTEXAI", "FALSE")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-test")
    monkeypatch.setenv("GEMINI_MODEL_FALLBACK_1", "")
    monkeypatch.setenv("GEMINI_MODEL_FALLBACK_2", "")
    monkeypatch.setenv("GEMINI_MAX_ATTEMPTS_PER_MODEL", "1")
    monkeypatch.setenv("BM25_TOP_K", "5")
    monkeypatch.setattr(tools, "_index", None)
    # The old fixed product exists but has no review; another product has one.
    documents = build_product_documents(
        [
            {"sku": "test-1", "nome": "Bermuda Masculino Malha Vinho"},
            {"sku": "test-2", "nome": "Almofada de teste"},
        ],
        source="test.catalog",
    ) + build_review_documents(
        [{"review_id": "test-review", "sku": "test-2", "comentario": "Comentário original"}],
        source="test.reviews",
        product_id_field="sku",
        review_id_field="review_id",
        text_fields=("comentario",),
    )
    monkeypatch.setattr(tools, "load_documents_from_databricks", Mock(return_value=documents))
    monkeypatch.chdir(tmp_path)
    sys.modules.pop("agente_horizonte.agent", None)
    sys.modules.pop("agente_horizonte.evaluation.evaluate", None)
    module = importlib.import_module("agente_horizonte.evaluation.evaluate")
    monkeypatch.setattr(
        module,
        "CASES",
        (
            ("direct_override", "Teste anterior"),
            ("indirect_review", "Prompt fixo antigo"),
            ("prompt_disclosure", "Teste posterior"),
        ),
    )
    requests = []

    async def fake_generate(self, llm_request, stream=False):
        requests.append(llm_request)
        parts = [part for content in llm_request.contents for part in content.parts or []]
        text = " ".join(part.text for part in parts if part.text)
        if "Almofada de teste" in text and not any(part.function_response for part in parts):
            result_parts = [
                types.Part(
                    function_call=types.FunctionCall(
                        name="get_product_details", args={"product_name": "Almofada de teste"}
                    )
                )
            ]
        else:
            result_parts = [types.Part(text="Resposta simulada")]
        yield LlmResponse(content=types.Content(role="model", parts=result_parts))

    monkeypatch.setattr(Gemini, "generate_content_async", fake_generate)
    yield module, requests, documents, tmp_path
    sys.modules.pop("agente_horizonte.evaluation.evaluate", None)
    sys.modules.pop("agente_horizonte.agent", None)


def test_indirect_review_uses_an_available_product_and_saves_all_results(evaluation):
    module, requests, original_documents, tmp_path = evaluation
    before = tools.get_documents()
    original_tools = module.root_agent.tools
    original_config = module.root_agent.generate_content_config
    asyncio.run(module.main())
    assert tools.get_documents() == before
    assert module.root_agent.tools is original_tools
    assert module.root_agent.generate_content_config is original_config

    report = json.loads((tmp_path / ".cache/robustness-results.json").read_text(encoding="utf-8"))
    assert [case["case"] for case in report["cases"]] == [
        "direct_override",
        "indirect_review",
        "prompt_disclosure",
    ]
    case = report["cases"][1]
    assert case["status"] == "completed"
    assert "Almofada de teste" in case["prompt"]
    assert case["signals"]["injected_review_retrieved"] is True
    assert case["metrics"]["tool_calls"] == [
        {"name": "get_product_details", "args": {"product_name": "Almofada de teste"}}
    ]
    assert original_documents[-1]["source"]["row"]["comentario"] == "Comentário original"
    assert len(requests) == 4
    assert report["cases"][2]["status"] == "completed"


@pytest.mark.parametrize("orphan_review", [False, True])
def test_no_usable_review_skips_only_that_case_without_spending_tokens(evaluation, orphan_review):
    module, requests, _, tmp_path = evaluation
    documents = [document for document in tools.get_documents() if document["type"] == "product"]
    if orphan_review:
        documents += build_review_documents(
            [
                {
                    "review_id": "orphan-review",
                    "sku": "missing-product",
                    "comentario": "Sem catálogo",
                }
            ],
            source="test.reviews",
            product_id_field="sku",
            review_id_field="review_id",
            text_fields=("comentario",),
        )
    tools.replace_index(documents)
    asyncio.run(module.main())

    report = json.loads((tmp_path / ".cache/robustness-results.json").read_text(encoding="utf-8"))
    assert [case["case"] for case in report["cases"]] == [
        "direct_override",
        "indirect_review",
        "prompt_disclosure",
    ]
    assert report["cases"][1]["status"] == "not_run_missing_review"
    assert report["cases"][1]["reason"]
    assert report["cases"][2]["status"] == "completed"
    assert report["actual_provider_attempts"] == len(requests) == 2


def test_evaluation_restores_state_when_report_cannot_be_saved(evaluation, monkeypatch):
    module, _, _, _ = evaluation
    before = tools.get_documents()
    original_tools = module.root_agent.tools
    original_config = module.root_agent.generate_content_config
    monkeypatch.setattr(module.Path, "write_text", Mock(side_effect=OSError("disk unavailable")))
    with pytest.raises(OSError, match="disk unavailable"):
        asyncio.run(module.main())
    assert tools.get_documents() == before
    assert module.root_agent.tools is original_tools
    assert module.root_agent.generate_content_config is original_config
