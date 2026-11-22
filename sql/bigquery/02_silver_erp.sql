-- 02 · Silver · ERP (canal loja física)
-- Equivalente ao notebook pipeline/07_silver_erp (D07, D18).
-- Nenhuma linha é removida: cada problema tem a sua marcação, e o filtro acontece na gold.
--
-- Diferenças em relação ao Databricks:
--   * DECIMAL(12,2) → NUMERIC(12,2);
--   * INT → INT64;
--   * TIMESTAMP → DATETIME: a hora do cupom é local, sem fuso. No BigQuery, TIMESTAMP seria lido como UTC;
--   * COUNT_IF → COUNTIF.
--   ROW_NUMBER(), NULLIF, CAST e as CTEs são iguais nos dois motores.
-- A mais: a tabela de vendas é particionada por data (no Databricks Free Edition não há esse ajuste).

-- 1. Cadastros ----------------------------------------------------------------

CREATE OR REPLACE TABLE `lojas-horizonte.silver.erp_lojas` AS
SELECT loja_id, nome, cidade, uf, porte
FROM `lojas-horizonte.bronze.erp_lojas`;

CREATE OR REPLACE TABLE `lojas-horizonte.silver.erp_produtos` AS
SELECT sku, nome, modelo, categoria, grupo,
       CAST(preco_tabela AS NUMERIC(12,2)) AS preco_tabela,
       CAST(custo AS NUMERIC(12,2))        AS custo
FROM `lojas-horizonte.bronze.erp_produtos`;

-- 2. Vendas: tipar, marcar cada problema e combinar as marcações em valido ------
-- As etapas ficam em CTEs porque o BigQuery não deixa usar um alias criado no mesmo SELECT.

CREATE OR REPLACE TABLE `lojas-horizonte.silver.erp_vendas`
PARTITION BY data
CLUSTER BY loja_id
AS
WITH tipada AS (
  SELECT cupom_id,
         CAST(data_hora AS DATETIME)           AS data_hora,
         loja_id,
         NULLIF(sku, '')                       AS sku,
         CAST(quantidade AS INT64)             AS quantidade,
         CAST(preco_unitario AS NUMERIC(12,2)) AS preco_unitario,
         CAST(valor_total AS NUMERIC(12,2))    AS valor_total
  FROM `lojas-horizonte.bronze.erp_vendas`
),
marcada AS (
  SELECT t.*,
         p.categoria,
         p.grupo,
         CAST(t.quantidade * p.custo AS NUMERIC(12,2)) AS custo_total,
         t.sku IS NULL                                 AS sku_nulo,
         t.sku IS NOT NULL AND p.sku IS NULL           AS sku_sem_cadastro,
         t.quantidade < 0                              AS quantidade_negativa,
         ROW_NUMBER() OVER (
           PARTITION BY t.cupom_id, t.data_hora, t.loja_id, t.sku,
                        t.quantidade, t.preco_unitario, t.valor_total
           ORDER BY t.cupom_id) > 1                    AS duplicada
  FROM tipada t
  LEFT JOIN `lojas-horizonte.silver.erp_produtos` p ON p.sku = t.sku
)
SELECT cupom_id, data_hora, CAST(data_hora AS DATE) AS data, loja_id,
       sku, categoria, grupo,
       quantidade, preco_unitario, valor_total, custo_total,
       sku_nulo, sku_sem_cadastro, quantidade_negativa, duplicada,
       NOT (sku_nulo OR sku_sem_cadastro OR quantidade_negativa OR duplicada) AS valido
FROM marcada;

-- 3. Estoque diário -----------------------------------------------------------

CREATE OR REPLACE TABLE `lojas-horizonte.silver.erp_estoque_diario`
PARTITION BY data
CLUSTER BY loja_id
AS
SELECT CAST(data AS DATE)             AS data,
       loja_id,
       sku,
       CAST(estoque_inicial AS INT64) AS estoque_inicial,
       CAST(entradas AS INT64)        AS entradas,
       CAST(saidas AS INT64)          AS saidas,
       CAST(estoque_final AS INT64)   AS estoque_final
FROM `lojas-horizonte.bronze.erp_estoque_diario`;

-- 4. Conferência --------------------------------------------------------------
-- As marcações repetem a bronze (400 / 401 / 801); receita e ticket batem com o gerador (D17, D18).

SELECT COUNT(*)                     AS linhas,               -- 401.335
       COUNTIF(sku_nulo)            AS sku_nulo,             -- 400
       COUNTIF(sku_sem_cadastro)    AS sku_sem_cadastro,     -- 0
       COUNTIF(quantidade_negativa) AS quantidade_negativa,  -- 401
       COUNTIF(duplicada)           AS duplicada,            -- 801
       COUNTIF(valido)              AS validas,              -- 399.736
       SUM(IF(valido, valor_total, NULL)) AS receita_valida  -- 30.795.090,78
FROM `lojas-horizonte.silver.erp_vendas`;

SELECT ROUND(AVG(total_cupom), 2) AS ticket_medio   -- 136,78
FROM (
  SELECT cupom_id, SUM(valor_total) AS total_cupom
  FROM `lojas-horizonte.silver.erp_vendas`
  WHERE valido
  GROUP BY cupom_id
);
