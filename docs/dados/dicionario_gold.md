# Dicionário de dados · camada gold

Contrato das tabelas que o dashboard (Henry) e o agente de recomendação (Emanuel) consomem.
Todas ficam em `horizonte.gold` no Databricks; no desenho do GCP, num dataset `gold` do BigQuery.
Notebook que gera: `pipeline/11_gold.ipynb` (lê a silver unificada do `pipeline/10_silver_unificada.ipynb`).

**Acesso (D22):** Henry e Emanuel têm só leitura em `horizonte.gold`. Bronze e silver ficam restritas ao pipeline.

## Regras que valem para todas as tabelas

| Regra | Detalhe |
|---|---|
| Só vendas válidas | A gold já vem filtrada (`WHERE valido` na silver, D07). Não é preciso filtrar de novo |
| Uma tabela por assunto | Cada tabela responde a uma pergunta de negócio e tem a coluna `canal`, mesmo quando só um canal tem dados |
| Canais | `loja_fisica` (ERP sintético), `marketplace` (Olist, dados reais com datas deslocadas, D10) e `site` (histórico sintético + API) |
| Receita sem frete | Em todos os canais: o ERP não tem frete e o marketplace foi tratado sem frete (D20). O frete do site fica em `silver.site_pedidos` |
| Datas | Horário de Brasília. Os horários do site chegam em UTC e são convertidos na silver |
| Ticket médio de um período | `SUM(receita) ÷ SUM(pedidos)`. **Nunca** a média dos tickets diários |
| Taxas de um período | Somar numerador e denominador e dividir no fim. **Nunca** a média das taxas diárias |

## Período coberto por canal

| Canal | Início | Fim |
|---|---|---|
| Loja física | 01/02/2025 | 15/11/2026 |
| Marketplace | 09/01/2025 (primeira venda válida) | 04/09/2026 (fim do dataset Olist, D10) |
| Site | 01/02/2025 | 17/11/2026 (corte do histórico); depois, pedidos da API |

O dashboard deve indicar as datas de corte: a queda do marketplace depois de setembro de 2026 é fim dos dados, não queda de vendas.

---

## gold_vendas_diarias

Receita, unidades, custo e margem. **Grão:** uma linha por dia × canal × loja × categoria.

| Coluna | Tipo | Descrição |
|---|---|---|
| `data` | DATE | Dia da venda |
| `canal` | STRING | `loja_fisica`, `marketplace` ou `site` |
| `loja_id` | STRING | Loja física (`L01` a `L12`); nulo no marketplace e no site |
| `categoria` | STRING | Uma das 9 categorias do catálogo |
| `grupo` | STRING | Vestuário, Acessórios, Beleza, Casa ou Esporte |
| `unidades` | BIGINT | Itens vendidos |
| `receita` | DECIMAL(12,2) | Valor vendido, sem frete |
| `custo` | DECIMAL(12,2) | Custo dos itens (CMV) |
| `margem_bruta` | DECIMAL(12,2) | `receita − custo` |
| `custo_estimado` | BOOLEAN | `true` no marketplace: o Olist não tem custo, que é estimado pela margem da categoria (D20). **Sinalizar no dashboard** |

## gold_pedidos_diarios

Pedidos e ticket médio. **Grão:** uma linha por dia × canal × loja.
Existe separada da tabela de vendas porque um pedido com produtos de duas categorias aparece em duas linhas de vendas.

| Coluna | Tipo | Descrição |
|---|---|---|
| `data` | DATE | Dia da venda |
| `canal` | STRING | Canal |
| `loja_id` | STRING | Loja física; nulo nos canais online |
| `pedidos` | BIGINT | Pedidos (ou cupons fiscais) distintos |
| `receita` | DECIMAL(12,2) | Valor vendido, sem frete |
| `ticket_medio` | DECIMAL(12,2) | `receita ÷ pedidos` do dia |

No marketplace, o pedido conta só os itens do mix da Horizonte (D04): um pedido Olist com uma bolsa e um eletrônico entra só com a bolsa.

## gold_estoque_diario

Estoque, giro e ruptura. **Grão:** uma linha por dia × loja × grupo. **Só a loja física:** o histórico do site não tem estoque (D23), e no marketplace o estoque é do vendedor.

| Coluna | Tipo | Descrição |
|---|---|---|
| `data` | DATE | Dia |
| `canal` | STRING | `loja_fisica` |
| `loja_id` | STRING | Loja |
| `grupo` | STRING | Grupo de produtos (a loja física não vende Casa, D16) |
| `skus` | BIGINT | SKUs do grupo no sortimento da loja |
| `estoque_final` | BIGINT | Unidades em estoque no fim do dia |
| `entradas` | BIGINT | Unidades recebidas de reposição no dia |
| `unidades_vendidas` | BIGINT | Saídas do estoque no dia |
| `skus_em_ruptura` | BIGINT | SKUs com estoque zero no fim do dia |

`unidades_vendidas` soma 404.165 no período, 800 a mais que as unidades da `gold_vendas_diarias` da loja física (403.365): são os itens das linhas de venda com sujeira (SKU nulo ou quantidade negativa), que saíram do estoque, mas cujo registro de venda chegou corrompido (D17, D18).

## gold_funil_diario

Funil de navegação, conversão, abandono e cancelamento. **Grão:** uma linha por dia. **Só o site.** Regras do contrato com a API (`SCHEMA_PIPELINE_v1`).

| Coluna | Tipo | Descrição |
|---|---|---|
| `data` | DATE | Dia em que a sessão começou |
| `canal` | STRING | `site` |
| `sessoes` | BIGINT | Sessões (visitas) |
| `sessoes_produto` | BIGINT | Sessões que abriram ao menos um produto |
| `sessoes_carrinho` | BIGINT | Sessões com `add_to_cart` |
| `sessoes_checkout` | BIGINT | Sessões com `begin_checkout` |
| `sessoes_compra` | BIGINT | Sessões com `purchase` |
| `carrinhos_abandonados` | BIGINT | Sessões com carrinho, sem compra, e com o último evento há mais de 30 minutos |
| `checkouts_abandonados` | BIGINT | Sessões com checkout iniciado e sem compra |
| `pedidos_finalizados` | BIGINT | Pedidos `FINALIZADO` comprados no dia |
| `pedidos_cancelados` | BIGINT | Pedidos `CANCELADO` comprados no dia |
| `taxa_conversao` | DOUBLE | `sessoes_compra ÷ sessoes` |
| `taxa_abandono_carrinho` | DOUBLE | `carrinhos_abandonados ÷ sessoes_carrinho` |
| `taxa_abandono_checkout` | DOUBLE | `checkouts_abandonados ÷ sessoes_checkout` |
| `taxa_cancelamento` | DOUBLE | `pedidos_cancelados ÷ (finalizados + cancelados)` |

A regra dos 30 minutos usa como referência o último evento dos dados, e não a hora atual, para o resultado não mudar a cada execução.

## gold_catalogo

Produtos para o agente de recomendação (D21). **Grão:** uma linha por produto (200 SKUs).
**Sem `custo` e sem `popularidade`:** são dados internos, e o agente conversa com clientes.

| Coluna | Tipo | Descrição |
|---|---|---|
| `sku` | STRING | Código do produto (chave) |
| `nome`, `modelo` | STRING | Nome completo e nome sem a cor |
| `categoria`, `grupo` | STRING | Classificação |
| `tipo`, `variacao`, `cor` | STRING | Partes do nome. `variacao` é material, estilo, linha ou fragrância; `cor` é nula em Beleza |
| `preco` | DECIMAL(12,2) | Preço de tabela |
| `descricao` | STRING | Uma ou duas frases sobre o produto |
| `ocasioes` | STRING | Ocasiões de uso separadas por `;` (ex.: `treino;corrida`) |
| `imagem_url` | STRING | `imagens/{categoria}/{tipo}.png` |
| `nota_media` | DECIMAL(3,2) | Média das notas das avaliações válidas do site (D25); vazia se o produto não tem avaliação |
| `qtd_avaliacoes` | BIGINT | Quantidade de avaliações válidas (0 se não tem) |
| `unidades_vendidas` | BIGINT | Loja física + site no período (o marketplace não tem SKU do catálogo, D12) |
| `unidades_30_dias` | BIGINT | Unidades nos 30 dias até a venda mais recente |

## gold_avaliacoes

Nota e texto das avaliações de produto do site, para o agente (D21) e, se o Caio usar, para a vitrine. **Grão:** uma linha por avaliação válida.
Fonte: `gera_avaliacoes.py` (D25), calibrado pelas avaliações reais do Olist; depois, as avaliações da API. Só entram avaliações com nota de 1 a 5, SKU do catálogo e compra anterior do mesmo cliente.
**Sem `usuario_hash` e `pedido_id`:** o agente conversa com clientes e não precisa saber quem avaliou.

| Coluna | Tipo | Descrição |
|---|---|---|
| `avaliacao_id` | STRING | Identificador (`H-` no histórico) |
| `sku` | STRING | Produto avaliado (liga com a `gold_catalogo`) |
| `nome_produto`, `categoria`, `grupo` | STRING | Do catálogo (`dim_produto`), não do arquivo de avaliações |
| `nota` | INT | De 1 a 5 |
| `titulo`, `comentario` | STRING | Podem ser vazios: muita avaliação tem só a nota |
| `data` | DATE | Dia da avaliação (horário de Brasília) |

## dim_data e dim_loja (views)

Dimensões publicadas na gold como **views** sobre a silver (`horizonte.silver.dim_data` e `horizonte.silver.dim_loja`): os consumidores continuam lendo só a gold (D22), e a view mostra sempre o dado atual.

**dim_data** · uma linha por dia, de 09/01/2025 a 31/12/2026

| Coluna | Tipo | Descrição |
|---|---|---|
| `data` | DATE | Dia (chave para as colunas `data` das outras tabelas) |
| `ano`, `mes` | INT | Ano e mês |
| `dia_semana` | INT | 1 = segunda ... 7 = domingo |
| `semana` | DATE | Segunda-feira da semana |
| `black_friday` | BOOLEAN | Sexta-feira de novembro entre os dias 23 e 29 (28/11/2025 e 27/11/2026) |
| `semana_black_friday` | BOOLEAN | A semana contém a Black Friday |

**dim_loja** · uma linha por loja física (12)

| Coluna | Tipo | Descrição |
|---|---|---|
| `loja_id` | STRING | `L01` a `L12` (chave para `loja_id` das outras tabelas) |
| `nome`, `cidade`, `uf` | STRING | Identificação da loja |
| `porte` | STRING | G, M ou P: define volume e sortimento (D17) |

Exemplo: receita da semana da Black Friday por loja
```sql
SELECT l.nome, l.cidade, SUM(v.receita) AS receita
FROM horizonte.gold.gold_vendas_diarias v
JOIN horizonte.gold.dim_data d ON d.data = v.data
JOIN horizonte.gold.dim_loja l ON l.loja_id = v.loja_id
WHERE d.semana_black_friday AND d.ano = 2025
GROUP BY l.nome, l.cidade
ORDER BY receita DESC;
```

## dq_resultados e dq_ultima_execucao

Resultado das checagens de qualidade (`pipeline/12_qualidade.ipynb`). Cada execução acrescenta uma linha por checagem; a view `dq_ultima_execucao` mostra só a mais recente.

| Coluna | Descrição |
|---|---|
| `execucao_id`, `executado_em` | Identificação e momento da execução |
| `camada`, `tabela`, `checagem`, `descricao` | O que foi checado |
| `esperado`, `encontrado` | Valor esperado e valor encontrado |
| `status` | `OK`, `FALHA` ou `INFO` (sem valor esperado) |

---

## Consultas dos indicadores

Escritas para o Databricks. **BigQuery:** `date_trunc('MONTH', data)` → `DATE_TRUNC(data, MONTH)`; o resto é igual.

**Receita e margem por canal e mês**
```sql
SELECT date_trunc('MONTH', data) AS mes, canal,
       SUM(receita) AS receita,
       ROUND(SUM(margem_bruta) / SUM(receita), 4) AS margem_pct,
       bool_or(custo_estimado) AS margem_estimada
FROM horizonte.gold.gold_vendas_diarias
GROUP BY 1, 2;
```

**Ticket médio por canal**
```sql
SELECT canal, ROUND(SUM(receita) / SUM(pedidos), 2) AS ticket_medio
FROM horizonte.gold.gold_pedidos_diarios
GROUP BY canal;
```

**Conversão, abandono e cancelamento do site**
```sql
SELECT ROUND(SUM(sessoes_compra) / SUM(sessoes), 4)                AS conversao,
       ROUND(SUM(carrinhos_abandonados) / SUM(sessoes_carrinho), 4) AS abandono_carrinho,
       ROUND(SUM(pedidos_cancelados)
             / SUM(pedidos_finalizados + pedidos_cancelados), 4)    AS cancelamento
FROM horizonte.gold.gold_funil_diario;
```

**Giro de estoque da loja física** (proposta, a confirmar com o Henry): unidades vendidas no período ÷ estoque médio no período
```sql
WITH por_dia AS (
  SELECT data, SUM(estoque_final) AS estoque, SUM(unidades_vendidas) AS vendidas
  FROM horizonte.gold.gold_estoque_diario
  WHERE data BETWEEN '2026-01-01' AND '2026-06-30'
  GROUP BY data
)
SELECT ROUND(SUM(vendidas) / AVG(estoque), 2) AS giro
FROM por_dia;
```

**Ruptura**
```sql
SELECT data, ROUND(SUM(skus_em_ruptura) / SUM(skus), 4) AS ruptura
FROM horizonte.gold.gold_estoque_diario
GROUP BY data;
```

## Valores de referência (conferidos em 19/11/2026)

Só o histórico. A cada carga ao vivo (D27), os números do site crescem com os pedidos da API: depois do teste de 20/11, o site tem 31.013 unidades e R$ 2.390.208,82.

| Canal | Unidades | Receita | Pedidos | Ticket médio |
|---|---|---|---|---|
| Loja física | 403.365 | R$ 30.795.090,78 | 225.151 | R$ 136,78 |
| Marketplace | 42.758 | R$ 5.250.663,26 | 38.266 | R$ 137,21 |
| Site | 31.011 | R$ 2.390.036,02 | 19.145 | R$ 124,84 |

Site: 669.148 sessões, conversão de 3,02%, abandono de carrinho de 69,8%, cancelamento de 5,1%.
Catálogo: 200 produtos, 434.376 unidades vendidas (loja física + site).
Avaliações (20/11/2026): 2.532 válidas, nota média 4,05, 1.024 com comentário, 197 produtos avaliados.

## Limitações

- **Dados sintéticos:** loja física, site e avaliações são gerados (D17, D23, D25), calibrados pelo Olist; só o marketplace é real.
- **Textos das avaliações montados por regra** (D25): variam pouco, e a nota média de cada produto vem de uma premissa de qualidade por SKU.
- **Margem do marketplace estimada** (`custo_estimado = true`).
- **Estoque só da loja física.**
- **Venda da loja física subestima a demanda nos picos:** quando o estoque zera, a venda perdida não aparece (D17).
- **Casa não é vendida na loja física** (D16): receita zero por desenho, não por falha.
