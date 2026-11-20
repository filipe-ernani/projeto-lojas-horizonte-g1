# databricks/ · Configuração do ambiente de execução

A pasta `pipeline/` guarda **o que** o pipeline faz (notebooks SQL). Esta pasta guarda **como** ele roda no Databricks: a definição do Job que executa os notebooks em ordem (issue #19, D26).

| Arquivo | Conteúdo |
|---|---|
| `jobs/horizonte_pipeline.json` | Definição do Job `horizonte_pipeline` (tarefas, dependências, origem do código) |

## O Job `horizonte_pipeline`

```
                ┌─ 01_bronze_olist ─ 03_silver_olist ─┐
00_setup ───────┼─ 06_bronze_erp ─── 07_silver_erp ───┼─ 10_silver_unificada ─ 11_gold ─ 12_qualidade
                └─ 08_bronze_site ── 09_silver_site ──┘
```

- **Três ramos em paralelo**, um por fonte: bronze e silver de cada canal não dependem dos outros. Eles se juntam na silver unificada (10). No máximo 3 tarefas rodam ao mesmo tempo (o Free Edition permite 5).
- **O código vem do `main` do GitHub** (`git_source`): o Job roda só o que já passou por PR, e cada execução fica ligada ao commit que rodou.
- **Compute serverless** (único disponível no Free Edition): nenhuma configuração de cluster.
- **Uma execução por vez** (`max_concurrent_runs: 1`); uma segunda chamada entra na fila. Limite de 1 hora.
- **Cada execução acrescenta um bloco em `gold.dq_resultados`** (notebook 12): o histórico mostra a qualidade de cada execução.

**Fora do Job**, porque são análises que rodam uma vez, não etapas do pipeline:
- `02_perfil_olist`: perfil que fundamenta as regras e calibra as avaliações;
- `04_calibracao_catalogo` e `05_sazonalidade`: geram as referências usadas pelos geradores sintéticos.

**Quando roda:** sob demanda (pelo botão *Run now* ou pelo `demo.sh` da issue #14). Não há agendamento: as fontes são arquivos que só mudam quando alguém envia um arquivo novo ao Volume.

## Comandos (WSL, na raiz do repositório)

Criar o Job (uma vez; devolve o `job_id`):

```bash
databricks jobs create --json @databricks/jobs/horizonte_pipeline.json
```

Atualizar o Job depois de mudar o JSON (substitui a definição inteira):

```bash
databricks jobs reset --json "{\"job_id\": <job_id>, \"new_settings\": $(cat databricks/jobs/horizonte_pipeline.json)}"
```

Rodar e esperar o fim:

```bash
databricks jobs run-now <job_id>
```

Conferir o resultado da qualidade depois da execução (SQL Editor):

```sql
SELECT status, COUNT(*) FROM horizonte.gold.dq_ultima_execucao GROUP BY status;  -- 23 OK, 2 INFO
```

## Equivalente no GCP

Dataform com uma *workflow configuration*: a ordem sai das dependências entre as tabelas (`ref()`), e a execução é agendada na própria configuração ou disparada por evento (arquivo novo no Cloud Storage → Cloud Workflows → Dataform). O Cloud Composer (Airflow gerenciado) foi descartado: tem custo fixo alto para um pipeline deste porte.
