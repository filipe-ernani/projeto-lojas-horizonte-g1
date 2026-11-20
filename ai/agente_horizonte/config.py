"""
Environment configuration for Databricks, retrieval and Gemini.
"""

import os
import re
from typing import Any


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value


def _identifier(name: str, parts: int = 1) -> str:
    identifiers = _required_env(name).split(".")
    if len(identifiers) != parts or any(
        not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", item) for item in identifiers
    ):
        raise ValueError(f"{name} must contain {parts} simple SQL identifier(s)")
    return ".".join(f"`{item}`" for item in identifiers)


def _timeout(name: str, default: int) -> int:
    try:
        value = int(os.getenv(name, str(default)))
    except ValueError:
        raise ValueError(f"{name} must be an integer between 1 and 300") from None
    if not 1 <= value <= 300:
        raise ValueError(f"{name} must be an integer between 1 and 300")
    return value


def databricks_connection_options() -> dict[str, Any]:
    hostname = _required_env("DATABRICKS_SERVER_HOSTNAME")
    http_path = _required_env("DATABRICKS_HTTP_PATH")
    if not re.fullmatch(r"[A-Za-z0-9]+(?:[.-][A-Za-z0-9]+)*", hostname):
        raise ValueError("DATABRICKS_SERVER_HOSTNAME must be a hostname without a URL scheme")
    if not re.fullmatch(r"/sql/1\.0/warehouses/[A-Za-z0-9-]+", http_path):
        raise ValueError("DATABRICKS_HTTP_PATH must be a SQL warehouse HTTP path")
    return {
        "server_hostname": hostname,
        "http_path": http_path,
        "access_token": _required_env("DATABRICKS_TOKEN"),
        "use_inline_params": False,
        "use_cloud_fetch": False,
        "enable_telemetry": False,
        "_socket_timeout": _timeout("DATABRICKS_SOCKET_TIMEOUT_SECONDS", 30),
        "_retry_stop_after_attempts_count": 1,
        "session_configuration": {
            "STATEMENT_TIMEOUT": str(_timeout("DATABRICKS_STATEMENT_TIMEOUT_SECONDS", 60)),
        },
    }


def catalog_identifiers() -> tuple[str, str, str]:
    return (
        _identifier("DATABRICKS_CATALOG_TABLE", parts=3),
        _identifier("DATABRICKS_CATALOG_PRODUCT_ID_COLUMN"),
        _identifier("DATABRICKS_CATALOG_CATEGORY_COLUMN"),
    )


def reviews_identifiers() -> tuple[str, str]:
    return (
        _identifier("DATABRICKS_REVIEWS_TABLE", parts=3),
        _identifier("DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN"),
    )


def bm25_top_k() -> int:
    try:
        value = int(os.getenv("BM25_TOP_K", "5"))
    except ValueError:
        raise ValueError("BM25_TOP_K must be a positive integer") from None
    if value < 1:
        raise ValueError("BM25_TOP_K must be a positive integer")
    return value


def gemini_models() -> tuple[str, ...]:
    _required_env("GOOGLE_API_KEY")
    if os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "false").strip().lower() not in {"", "false", "0"}:
        raise ValueError("Use a Google AI Studio API key; Vertex AI is not supported")
    models = []
    for name in ("GEMINI_MODEL", "GEMINI_MODEL_FALLBACK_1", "GEMINI_MODEL_FALLBACK_2"):
        model = _required_env(name) if name == "GEMINI_MODEL" else os.getenv(name, "").strip()
        if not model:
            continue
        if not re.fullmatch(r"gemini-[A-Za-z0-9][A-Za-z0-9._-]*", model):
            raise ValueError(f"{name} must contain one Gemini model ID")
        models.append(model)
    return tuple(models)


def gemini_max_attempts_per_model() -> int:
    try:
        value = int(os.getenv("GEMINI_MAX_ATTEMPTS_PER_MODEL", "2"))
    except ValueError:
        raise ValueError(
            "GEMINI_MAX_ATTEMPTS_PER_MODEL must be an integer between 1 and 3"
        ) from None
    if not 1 <= value <= 3:
        raise ValueError("GEMINI_MAX_ATTEMPTS_PER_MODEL must be an integer between 1 and 3")
    return value
