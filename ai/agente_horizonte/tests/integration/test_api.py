"""Exercise the native ADK API; only Gemini and the SQL connection are mocked."""

import importlib
import json
import subprocess
import sys
from datetime import date
from decimal import Decimal
from pathlib import Path
from shutil import copyfile
from unittest.mock import MagicMock, Mock

import pytest
from databricks.sql import exc
from fastapi.testclient import TestClient
from google.adk.cli.fast_api import get_fast_api_app
from google.adk.models.google_llm import Gemini
from google.adk.models.llm_response import LlmResponse
from google.genai import types

from agente_horizonte import tools
from agente_horizonte.data import databricks_client

APP_NAME = "agente_horizonte"
SESSION_PATH = f"/apps/{APP_NAME}/users/customer/sessions"


@pytest.fixture
def api(monkeypatch, tmp_path):
    for name, value in {
        "GOOGLE_API_KEY": "test-key",
        "GOOGLE_GENAI_USE_VERTEXAI": "FALSE",
        "GEMINI_MODEL": "gemini-test",
        "GEMINI_MODEL_FALLBACK_1": "",
        "GEMINI_MODEL_FALLBACK_2": "",
        "GEMINI_MAX_ATTEMPTS_PER_MODEL": "1",
        "BM25_TOP_K": "5",
        "DATABRICKS_SERVER_HOSTNAME": "test.databricks.com",
        "DATABRICKS_HTTP_PATH": "/sql/1.0/warehouses/test",
        "DATABRICKS_TOKEN": "test-token",
        "DATABRICKS_CATALOG_TABLE": "test.gold.catalog",
        "DATABRICKS_CATALOG_PRODUCT_ID_COLUMN": "sku",
        "DATABRICKS_CATALOG_CATEGORY_COLUMN": "categoria",
        "DATABRICKS_REVIEWS_TABLE": "test.gold.reviews",
        "DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN": "sku",
    }.items():
        monkeypatch.setenv(name, value)
    monkeypatch.setattr(tools, "_index", None)
    products = [
        {"sku": "HZ-001", "nome": "Tênis azul", "preco": Decimal("99.90"), "cor": "Azul"},
        {"sku": "HZ-002", "nome": "Tênis vermelho", "preco": Decimal("149.90")},
        {"sku": "HZ-003", "nome": "Mochila escolar"},
    ]
    reviews = [
        {
            "avaliacao_id": "REV-1",
            "sku": "HZ-001",
            "nota": 5,
            "titulo": "Excelente",
            "comentario": "Macio e confortável",
            "data": date(2026, 11, 18),
        },
        {"avaliacao_id": "REV-2", "sku": "HZ-002", "nota": 3, "comentario": None},
    ]
    connection = MagicMock()
    cursor = connection.__enter__.return_value.cursor.return_value.__enter__.return_value
    cursor.fetchall.side_effect = lambda: [
        Mock(asDict=Mock(return_value=row))
        for row in (reviews if "`reviews`" in cursor.execute.call_args.args[0] else products)
    ]
    connect = Mock(return_value=connection)
    monkeypatch.setattr(databricks_client.sql, "connect", connect)
    state = {"calls": [], "requests": [], "failure": False}

    async def generate(self, llm_request, stream=False):
        state["requests"].append(llm_request.model_copy(deep=True))
        if state["failure"]:
            raise RuntimeError("Simulated model failure")
        # Follow an explicit script: this tests protocol/evidence, not model reasoning.
        if len(state["requests"]) % 2:
            parts = [
                types.Part(function_call=types.FunctionCall(name=name, args=args))
                for name, args in state["calls"]
            ]
        else:
            parts = [types.Part(text=state.get("answer", "Resposta simulada: HZ-001, REV-1."))]
        yield LlmResponse(content=types.Content(role="model", parts=parts))

    monkeypatch.setattr(Gemini, "generate_content_async", generate)
    previous = sys.modules.pop("agente_horizonte.agent", None)
    importlib.import_module("agente_horizonte.agent")

    def client(agents_dir=None):
        return TestClient(
            get_fast_api_app(
                agents_dir=str(agents_dir or Path(__file__).resolve().parents[3]),
                session_service_uri=f"sqlite:///{(tmp_path / 'sessions.db').as_posix()}",
                use_local_storage=False,
                allow_origins=["http://localhost:5173"],
                web=False,
            ),
            base_url="http://localhost",
            raise_server_exceptions=False,
        )

    try:
        yield client, state, connect, cursor
    finally:
        sys.modules.pop("agente_horizonte.agent", None)
        if previous is not None:
            sys.modules["agente_horizonte.agent"] = previous


def run_payload(session_id, message="Quais as características do Tênis azul?", **changes):
    return {
        "appName": APP_NAME,
        "userId": "customer",
        "sessionId": session_id,
        "newMessage": {"role": "user", "parts": [{"text": message}]},
        **changes,
    }


def event_parts(events):
    return [part for event in events for part in event.get("content", {}).get("parts", [])]


def test_web_lists_only_the_real_agent(api):
    client, _, _, _ = api
    with client() as http:
        response = http.get("/list-apps")
        assert response.status_code == 200
        assert response.json() == [APP_NAME]


def test_web_lists_native_evaluation_cases(api):
    client, _, _, _ = api
    with client() as http:
        response = http.get(f"/apps/{APP_NAME}/eval-sets")
        assert response.status_code == 200
        assert "customer_support" in response.json()["evalSetIds"]
        cases = http.get(f"/apps/{APP_NAME}/eval_sets/customer_support/evals")
        assert cases.status_code == 200
        assert len(cases.json()) == 6


@pytest.mark.parametrize(("matches_reference", "expected_status"), [(True, 1), (False, 2)])
def test_web_runs_native_evaluation_and_records_pass_or_failure(
    api, tmp_path, matches_reference, expected_status
):
    from google.adk.cli.cli_eval import get_root_agent
    from google.adk.evaluation.eval_config import EvalConfig, get_eval_metrics_from_config
    from google.adk.evaluation.eval_set import EvalSet

    client, state, _, _ = api
    source = Path(__file__).resolve().parents[2]
    assert get_root_agent(str(source)) is sys.modules["agente_horizonte.agent"].root_agent
    # Keep the simulated eval history away from the developer's real ADK history.
    target = tmp_path / APP_NAME
    target.mkdir()
    for name in ("customer_support.evalset.json", "test_config.json"):
        copyfile(source / name, target / name)
    dataset = EvalSet.model_validate_json(
        (target / "customer_support.evalset.json").read_text(encoding="utf-8")
    )
    config = EvalConfig.model_validate_json(
        (target / "test_config.json").read_text(encoding="utf-8")
    )
    case = next(case for case in dataset.eval_cases if case.eval_id == "no_results")
    state["calls"] = [("search_products", {"query": "zzzinexistentexyz987654321"})]
    state["answer"] = (
        case.conversation[0].final_response.parts[0].text if matches_reference else "xyz"
    )
    # Match the name/threshold-only payload sent by this version of the Web UI.
    metrics = [
        {"metricName": metric.metric_name, "threshold": metric.threshold}
        for metric in get_eval_metrics_from_config(config)
    ]
    with client(agents_dir=tmp_path) as http:
        response = http.post(
            f"/apps/{APP_NAME}/eval-sets/customer_support/run",
            json={"evalCaseIds": ["no_results"], "evalMetrics": metrics},
        )
        assert response.status_code == 200, response.text
        result = response.json()["runEvalResults"][0]
        assert result["evalId"] == "no_results"
        assert result["finalEvalStatus"] == expected_status
        assert {metric["metricName"] for metric in result["overallEvalMetricResults"]} == {
            "tool_trajectory_avg_score",
            "response_match_score",
        }
        quality = next(
            metric
            for metric in result["overallEvalMetricResults"]
            if metric["metricName"] == "response_match_score"
        )
        assert quality["evalStatus"] == expected_status
        assert quality["score"] == (1.0 if matches_reference else 0.0)
    assert list((target / ".adk/eval_history").glob("*.evalset_result.json"))


def test_native_cli_runs_the_same_evaluation_set(api, tmp_path, monkeypatch):
    from click.testing import CliRunner
    from google.adk.cli.cli_tools_click import main
    from google.adk.evaluation.eval_set import EvalSet

    _, state, _, _ = api
    source = Path(__file__).resolve().parents[2]
    target = tmp_path / APP_NAME
    target.mkdir()
    for name in ("__init__.py", "customer_support.evalset.json", "test_config.json"):
        copyfile(source / name, target / name)
    dataset_path = target / "customer_support.evalset.json"
    dataset = EvalSet.model_validate_json(dataset_path.read_text(encoding="utf-8"))
    case = next(case for case in dataset.eval_cases if case.eval_id == "no_results")
    state["calls"] = [("search_products", {"query": "zzzinexistentexyz987654321"})]
    state["answer"] = case.conversation[0].final_response.parts[0].text
    monkeypatch.chdir(tmp_path)
    result = CliRunner().invoke(
        main,
        [
            "eval",
            APP_NAME,
            f"{APP_NAME}/customer_support.evalset.json:no_results",
            "--config_file_path",
            f"{APP_NAME}/test_config.json",
            "--print_detailed_results",
        ],
    )
    assert result.exit_code == 0, result.output
    assert "Overall Eval Status: PASSED" in result.output
    assert "response_match_score" in result.output


def test_native_cli_loads_agent_in_an_isolated_python_process(api, tmp_path):
    source = Path(__file__).resolve().parents[2]
    script = """
import sys
from unittest.mock import patch
from google.adk.cli.cli_eval import get_root_agent
with patch('databricks.sql.connect', side_effect=ConnectionError('Simulated offline warehouse')):
    agent = get_root_agent(sys.argv[1])
assert agent.name == 'agente_horizonte'
print('Isolated CLI agent loading passed')
"""
    result = subprocess.run(
        [sys.executable, "-I", "-c", script, str(source)],
        cwd=tmp_path,
        capture_output=True,
        text=True,
        timeout=60,
    )
    assert result.returncode == 0, result.stderr
    assert "Isolated CLI agent loading passed" in result.stdout


@pytest.mark.parametrize(
    ("message", "calls", "status", "names"),
    [
        (
            "Qual a cor e o preço do Tênis azul?",
            [("get_product_details", {"product_name": "Tênis azul"})],
            "success",
            ["Tênis azul"],
        ),
        (
            "O que dizem as avaliações do Tênis azul?",
            [("get_product_details", {"product_name": "Tênis azul"})],
            "success",
            ["Tênis azul"],
        ),
        (
            "Recomende tênis com as maiores notas",
            [("search_products", {"query": "tênis", "sort_by_rating": True})],
            "success",
            ["Tênis azul", "Tênis vermelho"],
        ),
        (
            "Compare Tênis azul e Tênis vermelho",
            [
                ("get_product_details", {"product_name": "Tênis azul"}),
                ("get_product_details", {"product_name": "Tênis vermelho"}),
            ],
            "success",
            ["Tênis azul", "Tênis vermelho"],
        ),
        (
            "Há geladeirainexistente?",
            [("search_products", {"query": "geladeirainexistente"})],
            "no_results",
            [],
        ),
        (
            "Mochila escolar é impermeável? Tem avaliações?",
            [("get_product_details", {"product_name": "Mochila escolar"})],
            "success",
            ["Mochila escolar"],
        ),
        (
            "Quais as avaliações do Tênis vermelho?",
            [("get_product_details", {"product_name": "Tênis vermelho"})],
            "success",
            ["Tênis vermelho"],
        ),
    ],
    ids=[
        "attributes",
        "reviews",
        "recommendation",
        "comparison",
        "no_results",
        "missing_feature_and_reviews",
        "rating_without_comment",
    ],
)
def test_api_passes_sql_evidence_through_real_tools(api, message, calls, status, names):
    client, state, connect, cursor = api
    state["calls"] = calls
    with client() as http:
        session = http.post(SESSION_PATH, json={})
        assert session.status_code == 200
        response = http.post("/run", json=run_payload(session.json()["id"], message))
    assert response.status_code == 200, response.text
    assert isinstance(response.json(), list)
    parts = event_parts(response.json())
    evidence = [
        part["functionResponse"]["response"] for part in parts if "functionResponse" in part
    ]
    assert len(evidence) == len(calls)
    assert all(item["status"] == status for item in evidence)
    products = [
        item for result in evidence for item in result["results"] if item["type"] == "product"
    ]
    assert [item["product_name"] for item in products] == names
    assert connect.call_count == 2  # Startup catalog + reviews; never per message.
    assert cursor.execute.call_count == 2
    assert all(call.kwargs["parameters"] == {} for call in cursor.execute.call_args_list)
    connect.return_value.__exit__.assert_called()
    model_evidence = [
        part.function_response.response
        for content in state["requests"][-1].contents
        for part in content.parts or []
        if part.function_response
    ]
    assert model_evidence == evidence
    final = " ".join(part.get("text", "") for part in parts)
    assert "[omitido]" in final
    assert "HZ-001" not in json.dumps(parts) and "REV-1" not in json.dumps(parts)
    if names and names[0] == "Tênis azul":
        assert products[0]["data"]["preco"] == "99.90"
    if calls[0][0] == "search_products" and status == "success":
        assert [item["average_rating"] for item in products] == [5, 3]
    if "reviews" in message.lower() or "avaliações" in message.lower():
        reviews = [
            item for result in evidence for item in result["results"] if item["type"] == "review"
        ]
        if names == ["Tênis azul"]:
            assert reviews[0]["data"]["comentario"] == "Macio e confortável"
            assert reviews[0]["data"]["data"] == "2026-11-18"
        elif names == ["Tênis vermelho"]:
            assert reviews == []
            assert products[0]["average_rating"] == 3
            assert products[0]["review_count"] == 1
        else:
            assert reviews == []
            assert products[0]["average_rating"] is None
            assert products[0]["review_count"] == 0
            assert "impermeavel" not in products[0]["data"]


def test_api_restores_sqlite_history_and_keeps_users_separate(api):
    client, state, connect, _ = api
    state["calls"] = [("get_product_details", {"product_name": "Tênis azul"})]
    with client() as http:
        session_id = http.post(SESSION_PATH, json={}).json()["id"]
        assert http.post("/run", json=run_payload(session_id)).status_code == 200
        before = http.get(f"{SESSION_PATH}/{session_id}").json()
    with client() as restarted:
        restored = restarted.get(f"{SESSION_PATH}/{session_id}")
        assert restored.status_code == 200
        assert restored.json()["events"] == before["events"]
        assert before["events"]
        assert (
            restarted.post("/run", json=run_payload(session_id, "E as avaliações?")).status_code
            == 200
        )
        assert len(restarted.get(f"{SESSION_PATH}/{session_id}").json()["events"]) > len(
            before["events"]
        )
        other_path = SESSION_PATH.replace("customer", "other")
        assert restarted.get(f"{other_path}/{session_id}").status_code == 404
        assert (
            restarted.post("/run", json=run_payload(session_id, userId="other")).status_code == 404
        )
    assert connect.call_count == 2
    assert len(state["requests"]) == 4
    assert any(content.role == "model" for content in state["requests"][2].contents)


@pytest.mark.parametrize(
    "changes", [{"sessionId": None}, {"newMessage": {"parts": "invalid"}}, {"userId": []}]
)
def test_api_rejects_invalid_payloads_without_calling_model(api, changes):
    client, state, _, _ = api
    with client() as http:
        response = http.post("/run", json=run_payload("unused", **changes))
        assert response.status_code == 422
    assert state["requests"] == []


def test_api_returns_404_for_missing_session(api):
    client, state, _, _ = api
    with client() as http:
        assert http.post("/run", json=run_payload("missing")).status_code == 404
    assert state["requests"] == []


def test_api_applies_explicit_cors_origins(api):
    client, _, _, _ = api
    with client() as http:
        for origin, status in [("http://localhost:5173", 200), ("https://unapproved.example", 403)]:
            response = http.options(
                "/run",
                headers={
                    "Origin": origin,
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "content-type",
                },
            )
            assert response.status_code == status
            assert response.headers.get("access-control-allow-origin") == (
                origin if status == 200 else None
            )


def test_api_returns_500_when_model_fails(api):
    client, state, _, _ = api
    state["failure"] = True
    with client() as http:
        session_id = http.post(SESSION_PATH, json={}).json()["id"]
        response = http.post("/run", json=run_payload(session_id))
        assert response.status_code == 500
        assert "test-key" not in response.text


def test_api_exposes_sql_failure_as_unavailability_not_no_results(api, monkeypatch):
    client, state, connect, _ = api
    connect.side_effect = exc.OperationalError("warehouse offline")
    monkeypatch.setattr(tools, "_index", None)
    assert not tools.initialize_index()
    state["calls"] = [("search_products", {"query": "tênis"})]
    with client() as http:
        session_id = http.post(SESSION_PATH, json={}).json()["id"]
        response = http.post("/run", json=run_payload(session_id))
        assert response.status_code == 200
    evidence = [
        part["functionResponse"]["response"]
        for part in event_parts(response.json())
        if "functionResponse" in part
    ]
    assert evidence[0]["status"] == "unavailable"
    assert evidence[0]["results"] == []


def test_api_rejects_oversized_input_without_calling_model(api):
    client, state, _, _ = api
    with client() as http:
        session_id = http.post(SESSION_PATH, json={}).json()["id"]
        response = http.post("/run", json=run_payload(session_id, "x" * 4001))
    assert response.status_code == 200
    assert "muito longa" in " ".join(part.get("text", "") for part in event_parts(response.json()))
    assert state["requests"] == []


def test_api_deduplicates_a_batch_and_resets_budget_on_next_message(api):
    client, state, _, _ = api
    state["calls"] = [("search_products", {"query": "tênis"})] * 20
    with client() as http:
        session_id = http.post(SESSION_PATH, json={}).json()["id"]
        for _ in range(2):
            response = http.post("/run", json=run_payload(session_id))
            assert response.status_code == 200
            parts = event_parts(response.json())
            assert sum("functionResponse" in part for part in parts) == 1
        stored = http.get(f"{SESSION_PATH}/{session_id}").json()
    assert len(state["requests"]) == 4
    assert all(request.config.max_output_tokens == 1024 for request in state["requests"])
    assert not any(key.startswith("temp:") for key in stored["state"])


def test_api_rejects_tool_batch_over_budget_before_executing_any_tool(api):
    client, state, _, _ = api
    state["calls"] = [("search_products", {"query": f"produto-{number}"}) for number in range(7)]
    with client() as http:
        session_id = http.post(SESSION_PATH, json={}).json()["id"]
        response = http.post("/run", json=run_payload(session_id))
    assert response.status_code == 200
    parts = event_parts(response.json())
    assert not any("functionResponse" in part for part in parts)
    assert "limite de consultas" in " ".join(part.get("text", "") for part in parts)
    assert len(state["requests"]) == 1


@pytest.mark.parametrize(
    ("repeat", "model_limit", "expected_models", "expected_tools"),
    [(True, 8, 2, 1), (False, 2, 2, 2), (False, 8, 7, 6)],
)
def test_api_stops_tool_loops_with_a_controlled_answer(
    api, monkeypatch, repeat, model_limit, expected_models, expected_tools
):
    client, state, _, _ = api
    monkeypatch.setenv("AGENT_MAX_MODEL_CALLS", str(model_limit))

    async def generate(self, llm_request, stream=False):
        state["requests"].append(llm_request.model_copy(deep=True))
        number = 1 if repeat else len(state["requests"])
        yield LlmResponse(
            content=types.Content(
                role="model",
                parts=[
                    types.Part(
                        function_call=types.FunctionCall(
                            name="search_products", args={"query": f"termo{number}"}
                        )
                    )
                ],
            )
        )

    monkeypatch.setattr(Gemini, "generate_content_async", generate)
    with client() as http:
        session_id = http.post(SESSION_PATH, json={}).json()["id"]
        response = http.post("/run", json=run_payload(session_id))
    assert response.status_code == 200
    parts = event_parts(response.json())
    assert len(state["requests"]) == expected_models
    assert sum("functionResponse" in part for part in parts) == expected_tools
    assert "limite de consultas" in " ".join(part.get("text", "") for part in parts)
