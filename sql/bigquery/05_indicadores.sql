-- 05 · Consultas dos indicadores (BigQuery)
-- Mesmas consultas da seção "Consultas dos indicadores" do docs/dados/dicionario_gold.md.
-- Ticket e taxas de um período: soma do numerador ÷ soma do denominador, nunca a média dos dias (D24).
--
-- Diferenças em relação ao Databricks:
--   * date_trunc('MONTH', data) → DATE_TRUNC(data, MONTH);
--   * bool_or → LOGICAL_OR;
--   * datas literais como DATE '2026-01-01';
--   * divisão de inteiros: os dois motores devolvem número decimal (FLOAT64 no BigQuery).
-- O filtro por data nas tabelas particionadas faz o BigQuery ler só os dias pedidos.

-- 1. Receita e margem por canal e mês (margem do marketplace estimada) --------

SELECT DATE_TRUNC(data, MONTH)                  AS mes,
       canal,
       SUM(receita)                              AS receita,
       ROUND(SUM(margem_bruta) / SUM(receita), 4) AS margem_pct,
       LOGICAL_OR(custo_estimado)                AS margem_estimada
FROM `lojas-horizonte.gold.gold_vendas_diarias`
GROUP BY mes, canal
ORDER BY mes, canal;

-- 2. Ticket médio por canal (sem frete) ---------------------------------------

SELECT canal, ROUND(SUM(receita) / SUM(pedidos), 2) AS ticket_medio
FROM `lojas-horizonte.gold.gold_pedidos_diarios`
GROUP BY canal;

-- 3. Conversão, abandono de carrinho e cancelamento do site -------------------
-- Lê a gold_funil_diario (só o site), que segue o padrão do notebook 11.

SELECT ROUND(SUM(sessoes_compra) / SUM(sessoes), 4)                AS conversao,
       ROUND(SUM(carrinhos_abandonados) / SUM(sessoes_carrinho), 4) AS abandono_carrinho,
       ROUND(SUM(pedidos_cancelados)
             / SUM(pedidos_finalizados + pedidos_cancelados), 4)    AS cancelamento
FROM `lojas-horizonte.gold.gold_funil_diario`;

-- 4. Giro de estoque da loja física, como cobertura em dias (D24) -------------
-- Cobertura = estoque médio ÷ venda média por dia. Giro do período = vendidas ÷ estoque médio.
-- Relação: cobertura = dias do período ÷ giro.

WITH por_dia AS (
  SELECT data, SUM(estoque_final) AS estoque, SUM(unidades_vendidas) AS vendidas
  FROM `lojas-horizonte.gold.gold_estoque_diario`
  WHERE data BETWEEN DATE '2026-01-01' AND DATE '2026-06-30'
  GROUP BY data
)
SELECT ROUND(AVG(estoque) / AVG(vendidas), 1) AS cobertura_dias,
       ROUND(SUM(vendidas) / AVG(estoque), 2) AS giro_no_periodo
FROM por_dia;

-- 5. Ruptura por dia (pares loja × SKU com estoque zero) ---------------------

SELECT data, ROUND(SUM(skus_em_ruptura) / SUM(skus), 4) AS ruptura
FROM `lojas-horizonte.gold.gold_estoque_diario`
GROUP BY data
ORDER BY data;
