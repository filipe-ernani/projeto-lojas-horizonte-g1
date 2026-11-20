from typing import Any

from databricks import sql
from databricks.sql import exc

from agente_horizonte.config import (
    catalog_identifiers,
    databricks_connection_options,
    reviews_identifiers,
)


def _query(statement: str, parameters: dict[str, Any]) -> list[dict[str, Any]]:
    options = databricks_connection_options()
    stage = "connection"
    try:
        with sql.connect(**options) as connection:
            stage = "query"
            with connection.cursor() as cursor:
                cursor.execute(statement, parameters=parameters)
                return [row.asDict() for row in cursor.fetchall()]
    except exc.Error as error:
        http_code = str(error.context.get("http-code", ""))
        if http_code in {"401", "403"} or "42501" in str(error):
            raise PermissionError(
                "Databricks authentication or authorization failed; check the token, "
                "warehouse access and table read permissions."
            ) from None
        if http_code in {"429", "503"}:
            raise ConnectionError(
                "Databricks is unavailable or its usage quota was reached."
            ) from None
        if stage == "connection" or isinstance(error, exc.OperationalError):
            raise ConnectionError(
                "Databricks connection failed; check the hostname, HTTP path and warehouse status."
            ) from None
        raise RuntimeError(
            "Databricks query failed; check the configured tables, columns and read permissions."
        ) from None
    except OSError:
        raise ConnectionError("Databricks network connection failed or timed out.") from None


def _limit_clause(limit: int | None, parameters: dict[str, Any]) -> str:
    if limit is None:
        return ""
    if type(limit) is not int or limit < 1:
        raise ValueError("limit must be a positive integer or None")
    parameters["limit"] = limit
    return " LIMIT :limit"


def fetch_products(
        product_id: str | None = None,
        category: str | None = None,
        *,
        limit: int | None = 1000,
    ) -> list[dict[str, Any]]:

    """
    Return original catalog fields; 
    use limit=None explicitly for a complete load.
    """
    table, id_column, category_column = catalog_identifiers()
    parameters: dict[str, Any] = {}
    filters = []
    if product_id is not None:
        filters.append(f"{id_column} = :product_id")
        parameters["product_id"] = product_id
    if category is not None:
        filters.append(f"{category_column} = :category")
        parameters["category"] = category
    where = " WHERE " + " AND ".join(filters) if filters else ""
    statement = f"SELECT * FROM {table}{where}" + _limit_clause(limit, parameters)
    return _query(statement, parameters)


def fetch_reviews(
        product_id: str | None = None,
        category: str | None = None,
        *,
        limit: int | None = 1000,
    ) -> list[dict[str, Any]]:

    """Read reviews already linked to products by Data Engineering, without inferring links."""

    table, id_column = reviews_identifiers()
    parameters: dict[str, Any] = {}
    filters = []
    if product_id is not None:
        filters.append(f"r.{id_column} = :product_id")
        parameters["product_id"] = product_id
    if category is not None:
        catalog_table, catalog_id, category_column = catalog_identifiers()
        filters.append(
            f"EXISTS (SELECT 1 FROM {catalog_table} AS p "
            f"WHERE p.{catalog_id} = r.{id_column} AND p.{category_column} = :category)"
        )
        parameters["category"] = category
    where = " WHERE " + " AND ".join(filters) if filters else ""
    statement = f"SELECT r.* FROM {table} AS r{where}" + _limit_clause(limit, parameters)
    return _query(statement, parameters)
