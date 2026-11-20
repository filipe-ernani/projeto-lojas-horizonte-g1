import asyncio
from unittest.mock import AsyncMock

import pytest
from google.adk.models.google_llm import Gemini
from google.adk.models.llm_request import LlmRequest
from google.adk.models.llm_response import LlmResponse
from google.genai import types
from google.genai.errors import APIError

from agente_horizonte.config import gemini_max_attempts_per_model, gemini_models
from agente_horizonte.models import GeminiFallback


@pytest.fixture
def gemini_env(monkeypatch):
    monkeypatch.setenv("GOOGLE_API_KEY", "unit-test-key")
    monkeypatch.setenv("GEMINI_MODEL", "gemini-primary")
    monkeypatch.setenv("GEMINI_MODEL_FALLBACK_1", " gemini-secondary ")
    monkeypatch.setenv("GEMINI_MODEL_FALLBACK_2", "gemini-tertiary")
    monkeypatch.delenv("GEMINI_MODELS", raising=False)
    monkeypatch.delenv("GEMINI_MAX_ATTEMPTS_PER_MODEL", raising=False)
    monkeypatch.delenv("GOOGLE_GENAI_USE_VERTEXAI", raising=False)


def test_model_configuration(gemini_env):
    assert gemini_models() == ("gemini-primary", "gemini-secondary", "gemini-tertiary")
    assert gemini_max_attempts_per_model() == 2


@pytest.mark.parametrize(
    "name", ["GEMINI_MODEL", "GEMINI_MODEL_FALLBACK_1", "GEMINI_MODEL_FALLBACK_2"]
)
@pytest.mark.parametrize(
    "value", ["gemini-primary,gemini-secondary", "gpt-other", "gemini-x/generate"]
)
def test_invalid_model_id_is_rejected(gemini_env, monkeypatch, name, value):
    monkeypatch.setenv(name, value)
    with pytest.raises(ValueError, match=name):
        gemini_models()


@pytest.mark.parametrize("value", [None, "", " "])
def test_primary_model_is_required(gemini_env, monkeypatch, value):
    if value is None:
        monkeypatch.delenv("GEMINI_MODEL")
    else:
        monkeypatch.setenv("GEMINI_MODEL", value)
    # The old variable must not silently supply the required primary model.
    monkeypatch.setenv("GEMINI_MODELS", "gemini-legacy")
    with pytest.raises(ValueError, match="GEMINI_MODEL"):
        gemini_models()


@pytest.mark.parametrize(
    ("first", "second", "expected"),
    [
        (None, None, ("gemini-primary",)),
        ("", " ", ("gemini-primary",)),
        ("gemini-secondary", "", ("gemini-primary", "gemini-secondary")),
        ("", "gemini-tertiary", ("gemini-primary", "gemini-tertiary")),
    ],
)
def test_fallbacks_are_optional(gemini_env, monkeypatch, first, second, expected):
    for name, value in (("GEMINI_MODEL_FALLBACK_1", first), ("GEMINI_MODEL_FALLBACK_2", second)):
        if value is None:
            monkeypatch.delenv(name)
        else:
            monkeypatch.setenv(name, value)
    assert gemini_models() == expected


def test_missing_api_key_is_rejected(gemini_env, monkeypatch):
    monkeypatch.delenv("GOOGLE_API_KEY")
    with pytest.raises(ValueError, match="GOOGLE_API_KEY"):
        gemini_models()


def test_vertex_ai_is_rejected(gemini_env, monkeypatch):
    monkeypatch.setenv("GOOGLE_GENAI_USE_VERTEXAI", "TRUE")
    with pytest.raises(ValueError, match="Vertex AI"):
        gemini_models()


@pytest.mark.parametrize("value", ["0", "-1", "4", "1.5", "invalid"])
def test_invalid_attempt_limit_is_rejected(gemini_env, monkeypatch, value):
    monkeypatch.setenv("GEMINI_MAX_ATTEMPTS_PER_MODEL", value)
    with pytest.raises(ValueError, match="GEMINI_MAX_ATTEMPTS_PER_MODEL"):
        gemini_max_attempts_per_model()


@pytest.fixture
def model():
    return GeminiFallback(
        model="gemini-primary",
        models=(Gemini(model="gemini-primary"), Gemini(model="gemini-secondary")),
        max_attempts_per_model=2,
    )


@pytest.fixture
def llm_request():
    return LlmRequest(
        model="gemini-primary",
        contents=[types.Content(role="user", parts=[types.Part(text="Compare products")])],
    )


def install_responses(monkeypatch, outcomes):
    calls = []
    sleep = AsyncMock()

    async def fake_generate(self, llm_request, stream=False):
        calls.append((self.model, llm_request, stream))
        outcome = outcomes.pop(0)
        if isinstance(outcome, Exception):
            # Gemini mutates its llm_request. A retry must not reuse that mutation.
            llm_request.contents.clear()
            raise outcome
        yield outcome

    monkeypatch.setattr(Gemini, "generate_content_async", fake_generate)
    monkeypatch.setattr("agente_horizonte.models.asyncio.sleep", sleep)
    return calls, sleep


def collect(model, llm_request, stream=False):
    async def run():
        return [
            response async for response in model.generate_content_async(llm_request, stream=stream)
        ]

    return asyncio.run(run())


def api_error(code):
    return APIError(code, {"error": {"message": "private API details", "code": code}})


def test_configured_fallbacks_are_used_in_order(gemini_env, llm_request, monkeypatch):
    names = gemini_models()
    model = GeminiFallback(
        model=names[0],
        models=tuple(Gemini(model=name) for name in names),
        max_attempts_per_model=1,
    )
    response = LlmResponse()
    calls, sleep = install_responses(monkeypatch, [api_error(503), api_error(503), response])
    assert collect(model, llm_request) == [response]
    assert [name for name, _, _ in calls] == list(names)
    assert sleep.await_count == 2


def test_primary_success_does_not_call_fallback(model, llm_request, monkeypatch, caplog):
    response = LlmResponse(content=types.Content(parts=[types.Part(text="Grounded answer")]))
    calls, sleep = install_responses(monkeypatch, [response])
    with caplog.at_level("INFO", logger="agente_horizonte.models"):
        assert collect(model, llm_request) == [response]
    assert [name for name, _, _ in calls] == ["gemini-primary"]
    assert "model=gemini-primary" in caplog.text
    sleep.assert_not_called()


@pytest.mark.parametrize("code", [408, 429, 500, 502, 503, 504])
def test_transient_failure_retries_then_falls_back_in_order(model, llm_request, monkeypatch, code):
    response = LlmResponse()
    calls, sleep = install_responses(monkeypatch, [api_error(code), api_error(code), response])
    original = llm_request.model_dump()
    assert collect(model, llm_request) == [response]
    assert [name for name, _, _ in calls] == [
        "gemini-primary",
        "gemini-primary",
        "gemini-secondary",
    ]
    assert calls[-1][1].model == "gemini-secondary"
    assert calls[-1][1].contents == llm_request.contents
    assert llm_request.model_dump() == original
    assert sleep.await_count == 2


@pytest.mark.parametrize("code", [400, 401, 403, 404])
def test_permanent_error_stops_without_exposing_details(
    model, llm_request, monkeypatch, caplog, code
):
    calls, sleep = install_responses(monkeypatch, [api_error(code)])
    with pytest.raises(RuntimeError, match=f"HTTP {code}") as caught:
        collect(model, llm_request)
    assert len(calls) == 1
    assert "private API details" not in str(caught.value) + caplog.text
    sleep.assert_not_called()


def test_all_models_exhausted_is_bounded(model, llm_request, monkeypatch):
    calls, sleep = install_responses(monkeypatch, [api_error(429) for _ in range(4)])
    with pytest.raises(RuntimeError, match="All configured Gemini models are unavailable"):
        collect(model, llm_request)
    assert [name for name, _, _ in calls] == [
        "gemini-primary",
        "gemini-primary",
        "gemini-secondary",
        "gemini-secondary",
    ]
    assert sleep.await_count == 3


def test_safety_response_does_not_trigger_fallback(model, llm_request, monkeypatch):
    blocked = LlmResponse(error_code="SAFETY", error_message="Blocked")
    calls, sleep = install_responses(monkeypatch, [blocked])
    assert collect(model, llm_request) == [blocked]
    assert len(calls) == 1
    sleep.assert_not_called()


def test_no_retry_after_partial_stream(model, llm_request, monkeypatch):
    emitted = []
    calls = []
    response = LlmResponse(content=types.Content(parts=[types.Part(text="Partial")]), partial=True)

    async def fake_generate(self, llm_request, stream=False):
        calls.append(stream)
        yield response
        raise api_error(503)

    monkeypatch.setattr(Gemini, "generate_content_async", fake_generate)

    async def run():
        async for item in model.generate_content_async(llm_request, stream=True):
            emitted.append(item)

    with pytest.raises(RuntimeError, match="response interrupted"):
        asyncio.run(run())
    assert emitted == [response]
    assert calls == [True]


def test_programming_errors_do_not_trigger_fallback(model, llm_request, monkeypatch):
    calls, sleep = install_responses(monkeypatch, [ValueError("invalid llm_request")])
    with pytest.raises(ValueError, match="invalid llm_request"):
        collect(model, llm_request)
    assert len(calls) == 1
    sleep.assert_not_called()
