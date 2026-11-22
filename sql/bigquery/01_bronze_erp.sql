-- 01 · Bronze · ERP (canal loja física)
-- Equivalente ao notebook pipeline/06_bronze_erp (D05, D06).
--
-- Duas etapas, porque o BigQuery não tem read_files:
--   1. tabela externa sobre o arquivo no bucket (o dado continua no Cloud Storage);
--   2. CREATE TABLE AS SELECT, que copia para uma tabela do BigQuery com as colunas de auditoria.
--
-- Diferenças em relação ao Databricks:
--   * read_files(..., inferSchema => false) → colunas declaradas como STRING na tabela externa.
--     Atenção: no CSV o BigQuery liga as colunas pela POSIÇÃO, não pelo nome do cabeçalho.
--     A ordem abaixo é a do gera_erp.py.
--   * skip_leading_rows = 1 pula o cabeçalho (header => true).
--   * .csv.gz → compression = 'GZIP' (no Databricks a compressão vem da extensão).
--   * _metadata.file_name → pseudocoluna _FILE_NAME (traz o caminho gs:// completo, não só o nome).
--   * current_timestamp() → CURRENT_TIMESTAMP().
--   * EXCEPT (_rescued_data) não existe aqui: não há coluna de resgate.

-- 1. Tabelas externas ---------------------------------------------------------

CREATE OR REPLACE EXTERNAL TABLE `lojas-horizonte.bronze.ext_erp_lojas` (
  loja_id STRING, nome STRING, cidade STRING, uf STRING, porte STRING
)
OPTIONS (format = 'CSV', skip_leading_rows = 1,
         uris = ['gs://lojas-horizonte-landing/erp/erp_lojas.csv']);

CREATE OR REPLACE EXTERNAL TABLE `lojas-horizonte.bronze.ext_erp_produtos` (
  sku STRING, nome STRING, modelo STRING, categoria STRING, grupo STRING,
  preco_tabela STRING, custo STRING
)
OPTIONS (format = 'CSV', skip_leading_rows = 1,
         uris = ['gs://lojas-horizonte-landing/erp/erp_produtos.csv']);

CREATE OR REPLACE EXTERNAL TABLE `lojas-horizonte.bronze.ext_erp_vendas` (
  cupom_id STRING, data_hora STRING, loja_id STRING, sku STRING,
  quantidade STRING, preco_unitario STRING, valor_total STRING
)
OPTIONS (format = 'CSV', skip_leading_rows = 1, compression = 'GZIP',
         uris = ['gs://lojas-horizonte-landing/erp/erp_vendas.csv.gz']);

CREATE OR REPLACE EXTERNAL TABLE `lojas-horizonte.bronze.ext_erp_estoque_diario` (
  data STRING, loja_id STRING, sku STRING,
  estoque_inicial STRING, entradas STRING, saidas STRING, estoque_final STRING
)
OPTIONS (format = 'CSV', skip_leading_rows = 1, compression = 'GZIP',
         uris = ['gs://lojas-horizonte-landing/erp/erp_estoque_diario.csv.gz']);

-- 2. Tabelas bronze (tudo como texto + auditoria) -----------------------------

CREATE OR REPLACE TABLE `lojas-horizonte.bronze.erp_lojas` AS
SELECT *, _FILE_NAME AS _arquivo_origem, CURRENT_TIMESTAMP() AS _ingerido_em
FROM `lojas-horizonte.bronze.ext_erp_lojas`;

CREATE OR REPLACE TABLE `lojas-horizonte.bronze.erp_produtos` AS
SELECT *, _FILE_NAME AS _arquivo_origem, CURRENT_TIMESTAMP() AS _ingerido_em
FROM `lojas-horizonte.bronze.ext_erp_produtos`;

CREATE OR REPLACE TABLE `lojas-horizonte.bronze.erp_vendas` AS
SELECT *, _FILE_NAME AS _arquivo_origem, CURRENT_TIMESTAMP() AS _ingerido_em
FROM `lojas-horizonte.bronze.ext_erp_vendas`;

CREATE OR REPLACE TABLE `lojas-horizonte.bronze.erp_estoque_diario` AS
SELECT *, _FILE_NAME AS _arquivo_origem, CURRENT_TIMESTAMP() AS _ingerido_em
FROM `lojas-horizonte.bronze.ext_erp_estoque_diario`;

-- 3. Conferência: a sujeira chegou intacta? -----------------------------------
-- Valores esperados pelo gerador (D17). COUNT_IF → COUNTIF.

SELECT
  COUNTIF(sku IS NULL OR sku = '')   AS sku_nulo,              -- 400
  COUNTIF(quantidade LIKE '-%')      AS quantidade_negativa,   -- 401
  COUNT(*) - (SELECT COUNT(*) FROM (
      SELECT DISTINCT cupom_id, data_hora, loja_id, sku, quantidade, preco_unitario, valor_total
      FROM `lojas-horizonte.bronze.erp_vendas`)) AS linhas_duplicadas   -- 801
FROM `lojas-horizonte.bronze.erp_vendas`;
