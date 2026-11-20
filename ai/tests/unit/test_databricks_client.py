import os
from unittest.mock import MagicMock

import pytest
from databricks.sql import exc

from agente_horizonte.config import databricks_connection_options
from agente_horizonte.data.databricks_client import fetch_products, fetch_reviews


@pytest.fixture(autouse=True)
def environment(monkeypatch):
    # Unit tests must never use local credentials or contact a real workspace.
    for name in os.environ:
        if name.startswith("DATABRICKS_"):
            monkeypatch.delenv(name)
    values = {
        "DATABRICKS_SERVER_HOSTNAME": "test.cloud.databricks.com",
        "DATABRICKS_HTTP_PATH": "/sql/1.0/warehouses/test123",
        "DATABRICKS_TOKEN": "unit-test-secret",
        "DATABRICKS_CATALOG_TABLE": "test.default.catalog",
        "DATABRICKS_CATALOG_PRODUCT_ID_COLUMN": "sku",
        "DATABRICKS_CATALOG_CATEGORY_COLUMN": "categoria",
        "DATABRICKS_REVIEWS_TABLE": "test.default.reviews",
        "DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN": "product_sku",
    }
    for name, value in values.items():
        monkeypatch.setenv(name, value)


@pytest.fixture(autouse=True)
def connector(monkeypatch):
    connect = MagicMock()
    monkeypatch.setattr("agente_horizonte.data.databricks_client.sql.connect", connect)
    return connect


@pytest.fixture
def cursor(connector):
    return connector.return_value.__enter__.return_value.cursor.return_value.__enter__.return_value


def test_connection_options():
    options = databricks_connection_options()
    assert options["access_token"] == "unit-test-secret"
    assert options["use_inline_params"] is False
    assert options["_retry_stop_after_attempts_count"] == 1
    assert options["_socket_timeout"] == 30
    assert options["session_configuration"] == {"STATEMENT_TIMEOUT": "60"}


@pytest.mark.parametrize(
    "name",
    ["DATABRICKS_SERVER_HOSTNAME", "DATABRICKS_HTTP_PATH", "DATABRICKS_TOKEN"],
)
def test_missing_credentials_fail_before_connection(name, monkeypatch, connector):
    monkeypatch.setenv(name, " ")
    with pytest.raises(ValueError, match=name):
        fetch_products()
    connector.assert_not_called()


@pytest.mark.parametrize(
    ("name", "value"),
    [
        ("DATABRICKS_SERVER_HOSTNAME", "https://test.cloud.databricks.com"),
        ("DATABRICKS_HTTP_PATH", "not-a-warehouse-path"),
        ("DATABRICKS_SOCKET_TIMEOUT_SECONDS", "0"),
        ("DATABRICKS_SOCKET_TIMEOUT_SECONDS", "301"),
        ("DATABRICKS_STATEMENT_TIMEOUT_SECONDS", "not-an-integer"),
    ],
)
def test_invalid_connection_settings(name, value, monkeypatch, connector):
    monkeypatch.setenv(name, value)
    with pytest.raises(ValueError, match=name):
        fetch_products()
    connector.assert_not_called()


@pytest.mark.parametrize(
    ("name", "value", "fetch"),
    [
        ("DATABRICKS_CATALOG_TABLE", "test.default.catalog; DROP TABLE reviews", fetch_products),
        ("DATABRICKS_CATALOG_TABLE", "catalog", fetch_products),
        ("DATABRICKS_CATALOG_PRODUCT_ID_COLUMN", "sku` OR 1=1", fetch_products),
        ("DATABRICKS_CATALOG_CATEGORY_COLUMN", "p.categoria", fetch_products),
        ("DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN", "id; SELECT 1", fetch_reviews),
        ("DATABRICKS_REVIEWS_TABLE", "", fetch_reviews),
    ],
)
def test_invalid_identifiers_never_reach_database(name, value, fetch, monkeypatch, connector):
    monkeypatch.setenv(name, value)
    with pytest.raises(ValueError, match=name):
        fetch()
    connector.assert_not_called()


@pytest.mark.parametrize("fetch", [fetch_products, fetch_reviews])
def test_empty_result(fetch, cursor):
    cursor.fetchall.return_value = []
    assert fetch() == []


@pytest.mark.parametrize("fetch", [fetch_products, fetch_reviews])
def test_returns_original_fields_and_closes_resources(fetch, connector, cursor):
    record = {"sku": "sku-1", "categoria": "moda", "optional_field": None}
    cursor.fetchall.return_value = [MagicMock(asDict=lambda: record)]
    assert fetch(limit=None) == [record]
    (statement,) = cursor.execute.call_args.args
    assert "LIMIT" not in statement
    connection_context = connector.return_value
    connection_context.__exit__.assert_called_once()
    connection_context.__enter__.return_value.cursor.return_value.__exit__.assert_called_once()


@pytest.mark.parametrize("fetch", [fetch_products, fetch_reviews])
@pytest.mark.parametrize("filters", [{"product_id": "a' OR 1=1 --"}, {"category": "moda"}])
def test_each_filter_uses_native_parameters(fetch, filters, cursor):
    cursor.fetchall.return_value = []
    fetch(**filters, limit=5)
    (statement,) = cursor.execute.call_args.args
    assert "WHERE" in statement
    assert next(iter(filters.values())) not in statement
    assert cursor.execute.call_args.kwargs["parameters"] == {**filters, "limit": 5}


def test_products_combined_filters(cursor):
    cursor.fetchall.return_value = []
    fetch_products(product_id="sku-1", category="moda", limit=10)
    cursor.execute.assert_called_once_with(
        "SELECT * FROM `test`.`default`.`catalog` "
        "WHERE `sku` = :product_id AND `categoria` = :category LIMIT :limit",
        parameters={"product_id": "sku-1", "category": "moda", "limit": 10},
    )


def test_reviews_category_uses_catalog_without_duplicating_rows(cursor):
    cursor.fetchall.return_value = []
    fetch_reviews(product_id="sku-1", category="moda")
    cursor.execute.assert_called_once_with(
        "SELECT r.* FROM `test`.`default`.`reviews` AS r "
        "WHERE r.`product_sku` = :product_id AND EXISTS "
        "(SELECT 1 FROM `test`.`default`.`catalog` AS p "
        "WHERE p.`sku` = r.`product_sku` AND p.`categoria` = :category) LIMIT :limit",
        parameters={"product_id": "sku-1", "category": "moda", "limit": 1000},
    )


def test_catalog_does_not_require_reviews_configuration(monkeypatch, cursor):
    monkeypatch.delenv("DATABRICKS_REVIEWS_TABLE")
    monkeypatch.delenv("DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN")
    cursor.fetchall.return_value = []
    assert fetch_products() == []
    with pytest.raises(ValueError, match="DATABRICKS_REVIEWS_TABLE"):
        fetch_reviews()


@pytest.mark.parametrize("limit", [0, -1, True, "10", 1.5])
@pytest.mark.parametrize("fetch", [fetch_products, fetch_reviews])
def test_invalid_limit(limit, fetch, connector):
    with pytest.raises(ValueError, match="limit"):
        fetch(limit=limit)
    connector.assert_not_called()


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (exc.RequestError("secret", context={"http-code": 401}), PermissionError),
        (exc.RequestError("secret", context={"http-code": "403"}), PermissionError),
        (exc.RequestError("secret", context={"http-code": 429}), ConnectionError),
        (exc.RequestError("secret", context={"http-code": 503}), ConnectionError),
        (exc.OperationalError("secret"), ConnectionError),
        (TimeoutError("secret"), ConnectionError),
    ],
)
def test_connection_errors_are_safe(error, expected, connector):
    connector.side_effect = error
    with pytest.raises(expected) as captured:
        fetch_products()
    assert "secret" not in str(captured.value)
    assert captured.value.__suppress_context__


@pytest.mark.parametrize("operation", ["execute", "fetchall"])
@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (exc.ServerOperationError("TABLE_NOT_FOUND secret"), RuntimeError),
        (exc.ServerOperationError("SQLSTATE: 42501 secret"), PermissionError),
        (exc.RequestError("secret"), ConnectionError),
    ],
)
def test_query_errors_are_safe_and_close_resources(operation, error, expected, connector, cursor):
    getattr(cursor, operation).side_effect = error
    with pytest.raises(expected) as captured:
        fetch_reviews()
    assert "secret" not in str(captured.value)
    assert captured.value.__suppress_context__
    connector.return_value.__exit__.assert_called_once()
    connector.return_value.__enter__.return_value.cursor.return_value.__exit__.assert_called_once()
