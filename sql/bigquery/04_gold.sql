-- 04 · Gold · Tabelas por assunto
-- Equivalente ao notebook pipeline/11_gold (D24): as tabelas que usam o caminho do ERP,
-- mais as views de dimensão. Só vendas válidas: o filtro WHERE valido acontece aqui, e só aqui (D07).
--
-- Diferenças em relação ao Databricks:
--   * bool_or → LOGICAL_OR; COUNT_IF → COUNTIF; DECIMAL → NUMERIC;
--   * a mais: tabelas diárias particionadas por data e clusterizadas por canal (D28).
--     Uma consulta de um mês lê só aquele mês, o que reduz o custo no modelo por dado lido.
--   * views da gold sobre a silver → authorized views (ver o README desta pasta).
--
-- Não traduzidas aqui (seguem o mesmo padrão, a partir da silver do site):
-- gold_funil_diario, gold_catalogo e gold_avaliacoes.

-- 1. gold_vendas_diarias: receita, unidades e margem --------------------------
-- Grão: dia × canal × loja × categoria. No marketplace o custo é estimado (custo_estimado = true).

CREATE OR REPLACE TABLE `lojas-horizonte.gold.gold_vendas_diarias`
PARTITION BY data
CLUSTER BY canal
AS
SELECT data, canal, loja_id, categoria, grupo,
       SUM(quantidade)            AS unidades,
       SUM(receita)               AS receita,
       SUM(custo)                 AS custo,
       SUM(receita) - SUM(custo)  AS margem_bruta,
       LOGICAL_OR(custo_estimado) AS custo_estimado
FROM `lojas-horizonte.silver.fato_vendas`
WHERE valido
GROUP BY data, canal, loja_id, categoria, grupo;

-- 2. gold_pedidos_diarios: pedidos e ticket médio ------------------------------
-- Ticket médio de um período = soma da receita ÷ soma dos pedidos (nunca a média dos dias).

CREATE OR REPLACE TABLE `lojas-horizonte.gold.gold_pedidos_diarios`
PARTITION BY data
CLUSTER BY canal
AS
SELECT data, canal, loja_id,
       COUNT(DISTINCT pedido_id)                                          AS pedidos,
       SUM(receita)                                                       AS receita,
       CAST(SUM(receita) / COUNT(DISTINCT pedido_id) AS NUMERIC(12,2))    AS ticket_medio
FROM `lojas-horizonte.silver.fato_vendas`
WHERE valido
GROUP BY data, canal, loja_id;

-- 3. gold_estoque_diario: estoque, giro e ruptura (só loja física) ------------
-- unidades_vendidas = saídas do estoque: inclui os itens das linhas com sujeira (+800, D18).
-- O canal é sempre loja_fisica, então o cluster é por loja.

CREATE OR REPLACE TABLE `lojas-horizonte.gold.gold_estoque_diario`
PARTITION BY data
CLUSTER BY loja_id
AS
SELECT e.data,
       'loja_fisica'                 AS canal,
       e.loja_id,
       p.grupo,
       COUNT(*)                      AS skus,
       SUM(e.estoque_final)          AS estoque_final,
       SUM(e.entradas)               AS entradas,
       SUM(e.saidas)                 AS unidades_vendidas,
       COUNTIF(e.estoque_final = 0)  AS skus_em_ruptura
FROM `lojas-horizonte.silver.erp_estoque_diario` e
JOIN `lojas-horizonte.silver.dim_produto` p ON p.sku = e.sku
GROUP BY e.data, e.loja_id, p.grupo;

-- 4. dim_data e dim_loja: views na gold sobre a silver (D22, D24) ------------

CREATE OR REPLACE VIEW `lojas-horizonte.gold.dim_data` AS
SELECT data, ano, mes, dia_semana, semana, black_friday, semana_black_friday
FROM `lojas-horizonte.silver.dim_data`;

CREATE OR REPLACE VIEW `lojas-horizonte.gold.dim_loja` AS
SELECT loja_id, nome, cidade, uf, porte
FROM `lojas-horizonte.silver.dim_loja`;

-- 5. Conferência: nenhuma venda se perdeu ou se duplicou na agregação --------

SELECT v.canal,
       v.unidades,                                       -- loja_fisica 403.365 · marketplace 42.758 · site 31.011
       v.receita,                                        -- loja_fisica 30.795.090,78 · marketplace 5.250.663,26
       p.pedidos,                                        -- loja_fisica 225.151 · site 19.145
       ROUND(p.receita / p.pedidos, 2) AS ticket_medio   -- loja_fisica 136,78 · site 124,84
FROM (SELECT canal, SUM(unidades) AS unidades, SUM(receita) AS receita
      FROM `lojas-horizonte.gold.gold_vendas_diarias` GROUP BY canal) v
JOIN (SELECT canal, SUM(pedidos) AS pedidos, SUM(receita) AS receita
      FROM `lojas-horizonte.gold.gold_pedidos_diarios` GROUP BY canal) p USING (canal)
ORDER BY v.canal;

SELECT
  (SELECT SUM(unidades_vendidas) FROM `lojas-horizonte.gold.gold_estoque_diario`)            AS saidas_estoque,      -- 404.165
  (SELECT SUM(ABS(quantidade)) FROM `lojas-horizonte.silver.erp_vendas` WHERE NOT duplicada) AS itens_vendidos_erp,  -- 404.165
  (SELECT SUM(skus_em_ruptura) FROM `lojas-horizonte.gold.gold_estoque_diario`)              AS loja_sku_dias_zerados; -- 19.560
