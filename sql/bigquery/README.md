# sql/bigquery · Versão BigQuery das transformações

O MVP roda no Databricks (D01), mas a arquitetura é desenhada no GCP (D02, `docs/architecture/gcp.md`). Esta pasta mostra que o mesmo pipeline roda no BigQuery: cada arquivo é a tradução, célula por célula, de um notebook de `pipeline/`, com as diferenças de sintaxe anotadas no topo.

**Escopo:** o caminho completo de uma fonte, o **ERP (loja física)**, da bronze até os indicadores. Marketplace e site seguem o mesmo padrão (notebooks 01, 03, 08 e 09) e entram na mesma `fato_vendas`.

**Status:** escrito a partir dos notebooks do `main` e **não executado**, porque o squad não tem sandbox do GCP (seção 12 do contexto). Os valores nos comentários são os do MVP. Com um projeto GCP, dá para validar a sintaxe sem custo e sem ler dado:

```bash
bq query --use_legacy_sql=false --dry_run < sql/bigquery/02_silver_erp.sql
```

## Arquivos (ordem de execução)

| Arquivo | Notebook equivalente | O que faz |
|---|---|---|
| `00_setup.sql` | `00_setup` | Datasets `bronze`, `silver`, `gold` e o bucket de entrada |
| `01_bronze_erp.sql` | `06_bronze_erp` | Tabelas externas sobre os CSVs do bucket e cópia para a bronze, tudo como texto, com `_arquivo_origem` e `_ingerido_em` |
| `02_silver_erp.sql` | `07_silver_erp` | Tipos, marcações de qualidade (`sku_nulo`, `duplicada` etc.) e `valido`, sem remover linhas |
| `03_silver_unificada.sql` | `09` (dim_produto) e `10_silver_unificada` | Dimensões e `fato_vendas` com os 3 canais |
| `04_gold.sql` | `11_gold` | `gold_vendas_diarias`, `gold_pedidos_diarios`, `gold_estoque_diario` e as views de dimensão |
| `05_indicadores.sql` | Dicionário da gold | Consultas dos indicadores do dashboard |

Nomes usados: projeto `lojas-horizonte` (= catálogo `horizonte`) e bucket `gs://lojas-horizonte-landing` (= Volume `horizonte.bronze.landing`).

## Diferenças de sintaxe que aparecem aqui

| Databricks | BigQuery |
|---|---|
| `read_files(..., inferSchema => false)` | Tabela externa com colunas `STRING` (no CSV, ligadas pela **posição**) |
| `_metadata.file_name` | `_FILE_NAME` (caminho `gs://` completo) |
| `DECIMAL(12,2)` · `INT` | `NUMERIC(12,2)` · `INT64` |
| `TIMESTAMP` (hora local) | `DATETIME` (o `TIMESTAMP` do BigQuery é sempre UTC) |
| `COUNT_IF` · `bool_or` | `COUNTIF` · `LOGICAL_OR` |
| `FROM VALUES (...) AS t(...)` | `FROM UNNEST([STRUCT(...)])` |
| `explode(sequence(...))` | `UNNEST(GENERATE_DATE_ARRAY(...))` |
| `date_trunc('WEEK', d)` · `weekday(d)` | `DATE_TRUNC(d, ISOWEEK)` · `MOD(EXTRACT(DAYOFWEEK FROM d) + 5, 7)` |
| Sem particionamento (Free Edition) | `PARTITION BY data` + `CLUSTER BY` nas tabelas diárias |

## O que muda em produção

- **Dataform em vez de arquivos soltos (D26, D28).** Cada `CREATE OR REPLACE TABLE` vira um arquivo `.sqlx` com `config { type: "table" }`, e as referências entre tabelas viram `${ref("erp_vendas")}`: o Dataform deduz a ordem de execução. As conferências viram *assertions*, que param a cadeia antes da gold se um número não bater.
- **Site pelo Datastream.** A bronze do site não vem de CSV: o Datastream grava as mudanças do Cloud SQL direto no dataset `bronze` (D28).
- **Views da gold como *authorized views*.** Para quem só lê a gold (D22, D29) conseguir consultar `gold.dim_data` e `gold.dim_loja`, as views precisam ser autorizadas no dataset `silver` (console: dataset `silver` → Compartilhamento → Autorizar views).
