-- 03 · Silver · Unificação dos canais (dimensões + fato)
-- Equivalente ao notebook pipeline/10_silver_unificada (D12, D20) e à dim_produto do início do 09.
--
-- Diferenças em relação ao Databricks:
--   * read_files sobre o catálogo → tabela externa com colunas STRING (na ordem do arquivo);
--   * DECIMAL → NUMERIC; data_hora como DATETIME em todos os canais;
--   * FROM VALUES (...) AS t(...) → UNNEST([STRUCT(...)]);
--   * explode(sequence(...)) → UNNEST(GENERATE_DATE_ARRAY(...));
--   * date_trunc('WEEK', d) → DATE_TRUNC(d, ISOWEEK) (semana começando na segunda);
--   * weekday(d) (0 = segunda) → MOD(EXTRACT(DAYOFWEEK FROM d) + 5, 7) (DAYOFWEEK: 1 = domingo);
--   * year/month/day → EXTRACT; make_date → DATE(a, m, d); bool_or → LOGICAL_OR.
--
-- Escopo: esta pasta traduz o caminho completo do ERP. A fato junta os 3 canais, como no MVP;
-- os blocos do marketplace e do site leem silver.marketplace_* e silver.site_*, que seguem o mesmo
-- padrão dos notebooks 03 e 09 e não foram traduzidos aqui.

-- 1. dim_produto (catálogo v2, D21) ------------------------------------------

CREATE OR REPLACE EXTERNAL TABLE `lojas-horizonte.silver.ext_catalogo` (
  sku STRING, nome STRING, modelo STRING, categoria STRING, grupo STRING,
  preco STRING, custo STRING, popularidade STRING, tipo STRING, variacao STRING,
  cor STRING, descricao STRING, ocasioes STRING, imagem_url STRING
)
OPTIONS (format = 'CSV', skip_leading_rows = 1,
         uris = ['gs://lojas-horizonte-landing/referencia/catalogo.csv']);

CREATE OR REPLACE TABLE `lojas-horizonte.silver.dim_produto` AS
SELECT sku, nome, modelo, categoria, grupo, tipo, variacao,
       NULLIF(cor, '')               AS cor,        -- Beleza não tem cor
       CAST(preco AS NUMERIC(12,2))  AS preco,
       CAST(custo AS NUMERIC(12,2))  AS custo,
       descricao, ocasioes, imagem_url
FROM `lojas-horizonte.silver.ext_catalogo`;

-- 2. dim_categoria: margem calculada do próprio catálogo ----------------------

CREATE OR REPLACE TABLE `lojas-horizonte.silver.dim_categoria` AS
SELECT categoria,
       grupo,
       CAST(ROUND(1 - SUM(custo) / SUM(preco_tabela), 2) AS NUMERIC(4,2)) AS margem
FROM `lojas-horizonte.silver.erp_produtos`
GROUP BY categoria, grupo;

-- 3. dim_canal e dim_loja -----------------------------------------------------

CREATE OR REPLACE TABLE `lojas-horizonte.silver.dim_canal` AS
SELECT *
FROM UNNEST([
  STRUCT('loja_fisica' AS canal, 'Loja física' AS nome, FALSE AS online),
  STRUCT('site'        AS canal, 'Site'        AS nome, TRUE  AS online),
  STRUCT('marketplace' AS canal, 'Marketplace' AS nome, TRUE  AS online)
]);

CREATE OR REPLACE TABLE `lojas-horizonte.silver.dim_loja` AS
SELECT loja_id, nome, cidade, uf, porte, 'loja_fisica' AS canal
FROM `lojas-horizonte.silver.erp_lojas`;

-- 4. fato_vendas: uma linha por item de venda, os 3 canais empilhados ---------

CREATE OR REPLACE TABLE `lojas-horizonte.silver.fato_vendas`
PARTITION BY data
CLUSTER BY canal
AS
SELECT 'loja_fisica'           AS canal,
       v.data,
       v.data_hora,
       v.cupom_id              AS pedido_id,
       v.loja_id,
       CAST(NULL AS STRING)    AS cliente_id,   -- cupom fiscal sem identificação do cliente
       v.sku                   AS produto_id,
       v.categoria,
       v.grupo,
       v.quantidade,
       v.valor_total           AS receita,
       v.custo_total           AS custo,
       FALSE                   AS custo_estimado,
       v.valido
FROM `lojas-horizonte.silver.erp_vendas` v

UNION ALL

SELECT 'marketplace',
       CAST(i.data_compra AS DATE),
       i.data_compra,                           -- DATETIME
       i.pedido_id,
       CAST(NULL AS STRING),
       p.cliente_id,                            -- customer_unique_id (D11)
       i.produto_id,
       i.categoria,
       c.grupo,
       i.quantidade,
       i.preco,                                 -- sem frete (D20)
       CAST(i.preco * (1 - c.margem) AS NUMERIC(12,2)),
       TRUE,                                    -- custo estimado pela margem da categoria
       i.valido AND i.incluir AND i.periodo_completo
FROM `lojas-horizonte.silver.marketplace_itens` i
JOIN `lojas-horizonte.silver.marketplace_pedidos` p ON p.pedido_id = i.pedido_id
LEFT JOIN `lojas-horizonte.silver.dim_categoria` c ON c.categoria = i.categoria

UNION ALL

SELECT 'site',
       i.data,
       p.finalizado_em,                         -- DATETIME(ts, 'America/Sao_Paulo') na silver do site
       i.pedido_id,
       CAST(NULL AS STRING),
       i.usuario_hash,
       i.sku,
       i.categoria,
       i.grupo,
       i.quantidade,
       i.receita,                               -- sem frete
       i.custo_total,
       FALSE,
       i.valido
FROM `lojas-horizonte.silver.site_pedido_itens` i
LEFT JOIN `lojas-horizonte.silver.site_pedidos` p
       ON p.pedido_id = i.pedido_id AND p.versao_atual;

-- 5. dim_data: da primeira venda válida até 31/12 do ano da última -----------
-- Black Friday por regra: sexta-feira de novembro entre os dias 23 e 29.

CREATE OR REPLACE TABLE `lojas-horizonte.silver.dim_data` AS
WITH limites AS (
  SELECT MIN(data) AS inicio,
         DATE(EXTRACT(YEAR FROM MAX(data)), 12, 31) AS fim
  FROM `lojas-horizonte.silver.fato_vendas`
  WHERE valido
),
dias AS (
  SELECT data
  FROM limites, UNNEST(GENERATE_DATE_ARRAY(inicio, fim, INTERVAL 1 DAY)) AS data
),
base AS (
  SELECT data,
         EXTRACT(YEAR FROM data)                         AS ano,
         EXTRACT(MONTH FROM data)                        AS mes,
         MOD(EXTRACT(DAYOFWEEK FROM data) + 5, 7) + 1    AS dia_semana,   -- 1 = segunda ... 7 = domingo
         DATE_TRUNC(data, ISOWEEK)                       AS semana,
         EXTRACT(MONTH FROM data) = 11
           AND EXTRACT(DAYOFWEEK FROM data) = 6          -- sexta-feira (1 = domingo)
           AND EXTRACT(DAY FROM data) BETWEEN 23 AND 29  AS black_friday
  FROM dias
)
SELECT *,
       LOGICAL_OR(black_friday) OVER (PARTITION BY semana) AS semana_black_friday
FROM base;

-- 6. Conferência --------------------------------------------------------------

SELECT canal,
       COUNT(*)                               AS linhas,    -- loja_fisica 401.335 · marketplace 112.650 · site 28.407
       COUNTIF(valido)                        AS validas,   -- loja_fisica 399.736 · marketplace 42.758 · site 26.934
       SUM(IF(valido, quantidade, NULL))      AS unidades,
       SUM(IF(valido, receita, NULL))         AS receita,   -- loja_fisica 30.795.090,78 · site 2.390.036,02
       COUNTIF(valido AND grupo IS NULL)      AS validas_sem_grupo  -- 0
FROM `lojas-horizonte.silver.fato_vendas`
GROUP BY canal
ORDER BY canal;

SELECT COUNT(*)              AS dias,             -- 722 (09/01/2025 a 31/12/2026)
       COUNTIF(black_friday) AS black_fridays     -- 2 (28/11/2025 e 27/11/2026)
FROM `lojas-horizonte.silver.dim_data`;
