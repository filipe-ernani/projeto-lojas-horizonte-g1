# IA — Lojas Horizonte

## IA-01: acesso ao Databricks

Consultas somente de leitura ao catálogo e aos reviews tratados, diretamente no SQL
warehouse. Não utiliza CSV, dados simulados em execução real ou dependências de RAG/LLM.

### Preparação

Requer Python 3.12+ (conforme o `pyproject.toml` existente) e `uv`. A partir de `ai/`:

```powershell
uv sync --locked
Copy-Item .env.example .env
```

Se `.env` já existir, preserve-o e preencha apenas as variáveis necessárias. Ele é
ignorado pelo Git. O código lê variáveis de ambiente; `uv run --env-file .env` carrega
o arquivo sem dependências adicionais.

### Configuração

| Variável | Finalidade |
| --- | --- |
| `DATABRICKS_SERVER_HOSTNAME` | Server Hostname em Connection Details do warehouse, sem `https://` |
| `DATABRICKS_HTTP_PATH` | HTTP Path do SQL warehouse, no formato `/sql/1.0/warehouses/...` |
| `DATABRICKS_TOKEN` | Token com acesso ao warehouse e leitura das tabelas |
| `DATABRICKS_CATALOG_TABLE` | Nome completo real: `catalogo.schema.tabela` |
| `DATABRICKS_CATALOG_PRODUCT_ID_COLUMN` | Coluna de produto; contrato confirmado: `sku` |
| `DATABRICKS_CATALOG_CATEGORY_COLUMN` | Coluna de categoria; contrato confirmado: `categoria` |
| `DATABRICKS_REVIEWS_TABLE` | Tabela tratada de reviews, quando entregue |
| `DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN` | Chave de produto nos reviews, confirmada pela equipe de Dados |
| `DATABRICKS_SOCKET_TIMEOUT_SECONDS` | Timeout de rede; padrão 30 segundos, entre 1 e 300 |
| `DATABRICKS_STATEMENT_TIMEOUT_SECONDS` | Timeout SQL da sessão; padrão 60 segundos, entre 1 e 300 |
| `RUN_DATABRICKS_INTEGRATION` | `1` habilita testes reais; desabilitados por padrão |

A autenticação usa o token já disponível no ambiente local. Confirme o suporte desse
método ao configurar outro workspace. São necessárias permissões de uso do warehouse,
catálogo e schema, além de `SELECT` nas tabelas. Não versionar nem registrar tokens.

Tabelas exigem três identificadores separados por ponto; cada identificador e nome de
coluna aceita letras ASCII, números e sublinhado, começando por letra ou sublinhado.
Os identificadores são validados e delimitados; os valores dos filtros usam parâmetros
SQL nativos. Os nomes vêm apenas da configuração da aplicação.

### Uso

```python
from agente_horizonte.data.databricks_client import fetch_products, fetch_reviews

products = fetch_products(limit=20)
product = fetch_products(product_id="sku-real")
category_products = fetch_products(category="categoria-real", limit=20)
filtered_products = fetch_products(product_id="sku-real", category="categoria-real")

# Requer tabela tratada e chave de produto configuradas:
reviews = fetch_reviews(product_id="sku-real", limit=20)
category_reviews = fetch_reviews(category="categoria-real", limit=20)
filtered_reviews = fetch_reviews(product_id="sku-real", category="categoria-real")
```

As duas funções retornam `list[dict]` com os campos originais; nenhum resultado retorna
`[]`. O limite padrão é de 1.000 registros, sem ordenação garantida. Para uma carga
completa explícita, use `fetch_products(limit=None)` ou `fetch_reviews(limit=None)`;
avalie o volume e a quota antes de carregar tabelas inteiras em memória.

Cada chamada abre uma conexão e fecha cursor/conexão ao terminar, inclusive em falhas.
Não há novas tentativas automáticas. Configuração inválida gera `ValueError`;
autenticação/autorização identificada pelo servidor gera `PermissionError`;
rede, indisponibilidade ou quota gera `ConnectionError`; demais erros SQL geram
`RuntimeError`. As mensagens expostas não reproduzem detalhes sensíveis do conector.

O filtro de categoria dos reviews usa `EXISTS` no catálogo pela chave do produto,
preservando os registros de review sem multiplicá-los por duplicatas do catálogo.
Não há associação inferida entre pedidos e produtos. Configurar reviews somente após
a entrega de uma relação inequívoca com o produto. Sem essa configuração, consultar
reviews falha explicitamente; consultas ao catálogo continuam funcionando.

### Testes e evidências

```powershell
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

Os testes unitários isolam as variáveis do Databricks e substituem a conexão por mock,
sem utilizar credenciais locais ou rede. Cobrem filtros individuais e combinados,
resultados vazios, campos originais, limites, identificadores inválidos, configuração
ausente, falhas de autenticação/conexão/consulta e fechamento de recursos.

Para consultas reais, com `.env` configurado:

```powershell
$env:RUN_DATABRICKS_INTEGRATION = '1'
uv run --env-file .env pytest tests/integration -m integration --show-capture=no
```

Validação executada em **16/11/2026**, com Python 3.12.14 e SQL Connector 4.9.0:

- Testes unitários: **48 passaram**; na execução padrão, os dois testes de integração
  foram ignorados por exigirem habilitação explícita.
- `uv sync --locked`, `ruff check` e `ruff format --check`: executados com sucesso.
- Integração real: **1 passou e 1 foi ignorado**. O catálogo retornou registros e os
  filtros por `sku`, por `categoria` e combinados foram verificados no Databricks.
- Reviews: consulta implementada e coberta por mocks. A validação real permanece
  **bloqueada** pela ausência da tabela tratada e da chave de produto, confirmada pelo
  responsável. Após a entrega, configurar ambas as variáveis e repetir a integração.

Referências: [SQL Connector for Python](https://docs.databricks.com/gcp/en/dev-tools/python-sql-connector),
[STATEMENT_TIMEOUT](https://docs.databricks.com/gcp/en/sql/language-manual/parameters/statement_timeout)
e [limitações da Free Edition](https://docs.databricks.com/gcp/en/getting-started/free-edition-limitations).
