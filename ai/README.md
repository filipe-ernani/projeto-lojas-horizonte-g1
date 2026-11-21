# IA — Lojas Horizonte

O **Hori** é o assistente de atendimento da Lojas Horizonte. Um único agente Google
ADK utiliza Gemini e ferramentas de consulta ao catálogo e às avaliações, recuperados
por BM25. Os dados vêm do Databricks e ficam em memória durante o atendimento.
O agente busca, recomenda e compara produtos por nome, sem expor identificadores internos.

Stack: **Python 3.12+**, **uv**, **Google ADK**, **Gemini API / Google AI Studio**,
**Databricks SQL Connector**, **rank-bm25**, **SQLite**, **pytest** e **ruff**.

Referência detalhada: [Documentação técnica final da IA](../docs/ai/DOCUMENTACAO_TECNICA.md).
Ela descreve arquitetura, configuração completa, contratos JSON, manutenção,
evidências de testes e limitações.

## Estrutura

```text
ai/
├── agente_horizonte/
│   ├── agent.py, config.py, models.py, prompt.py, tools.py
│   ├── data/databricks_client.py
│   ├── retrieval/           # documentos, normalização e BM25
│   ├── tests/               # unitários, API e Databricks
│   ├── evaluation/          # consultas de referência e ensaio de robustez
│   ├── customer_support.evalset.json
│   └── test_config.json
├── .env.example
├── pyproject.toml
└── uv.lock
```

## Preparação e configuração

Requer Python 3.12+, `uv`, acesso de leitura às tabelas preparadas e ao SQL warehouse
do Databricks, além de uma chave Gemini API com acesso aos modelos configurados.

Execute a partir da raiz do repositório, em PowerShell:

```powershell
Set-Location ai
uv sync --locked
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
```

Preencha `.env` com os valores do seu ambiente:

- Databricks: `DATABRICKS_SERVER_HOSTNAME` (sem `https://`), `DATABRICKS_HTTP_PATH`,
  `DATABRICKS_TOKEN`, `DATABRICKS_CATALOG_TABLE`,
  `DATABRICKS_CATALOG_PRODUCT_ID_COLUMN` e `DATABRICKS_CATALOG_CATEGORY_COLUMN`.
- Mapeamento atual do catálogo: `horizonte.gold.gold_catalogo`, `sku` e `categoria`.
- Reviews opcionais: `DATABRICKS_REVIEWS_TABLE=horizonte.gold.gold_avaliacoes` e
  `DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN=sku`. Para desativá-los, deixe ambas vazias.
  O agente usa `avaliacao_id`, `titulo` e `comentario` dessa fonte.
- Gemini: `GOOGLE_API_KEY`, `GOOGLE_GENAI_USE_VERTEXAI=FALSE` e `GEMINI_MODEL`.
  `GEMINI_MODEL_FALLBACK_1` e `GEMINI_MODEL_FALLBACK_2` são opcionais e ordenados.
  Não há modelo padrão no código. `gemini-3.1-flash-lite` consta na validação
  histórica; confirme o acesso ao ID escolhido na sua conta.
- `BM25_TOP_K=5` e `GEMINI_MAX_ATTEMPTS_PER_MODEL=2` são os padrões.

**Atenção ao template:** as seis variáveis de limites no fim de `.env.example`
estão vazias. Ao copiar o arquivo, preencha os valores abaixo ou remova essas linhas
do seu `.env`; vazio causa `ValueError`, não ativa o padrão:

```dotenv
AGENT_MAX_INPUT_CHARS=4000
AGENT_MAX_OUTPUT_TOKENS=1024
AGENT_MAX_TOOL_CALLS=6
AGENT_MAX_MODEL_CALLS=8
PRODUCT_MAX_REVIEWS=5
EVIDENCE_MAX_TEXT_CHARS=1000
```

Não versione `.env`, credenciais, bancos ou logs. Reinicie o servidor após mudar a
configuração ou os dados para reconstruir o índice em cada processo.

## Executar o agente e a API

Todos os comandos seguintes partem de `ai/`. Para persistir sessões em SQLite:

```powershell
New-Item -ItemType Directory -Force .adk | Out-Null

# Interface de desenvolvimento: http://127.0.0.1:8000
uv run --locked --env-file .env adk web --host 127.0.0.1 --port 8000 --no-reload --session_service_uri "sqlite:///.adk/session.db" .
```

Para servir somente a API, encerre o comando anterior e execute:

```powershell
uv run --locked --env-file .env adk api_server --host 127.0.0.1 --port 8000 --no-reload --session_service_uri "sqlite:///.adk/session.db" .
```

Selecione `agente_horizonte` no ADK Web. O diretório passado ao CLI é `ai/` (`.`
nesses comandos). Preserve `.adk/session.db` entre reinicializações. Não combine
a URI explícita com `--use_local_storage` ou `--no_use_local_storage` no ADK 1.39.1.
Não execute os dois servidores simultaneamente na mesma porta.

A API nativa cria sessões em
`POST /apps/agente_horizonte/users/{userId}/sessions` e recebe mensagens em
`POST /run`. Ela retorna **uma lista de eventos**, incluindo resultados de ferramentas
e texto, e exige a sessão previamente criada. Consulte os
[contratos e exemplos de consumo](../docs/ai/DOCUMENTACAO_TECNICA.md#6-api-e-integração-com-fullstack).

Busca direta no terminal, sem Gemini:

```powershell
uv run --locked --env-file .env python -X utf8 -m agente_horizonte.tests.search --reviews
# Alternativa: --best-rated para ordenar por nota média. Digite sair para encerrar.
```

## Testes

Para a suíte local com SQL/Gemini simulados e integrações reais desabilitadas,
evite que o ADK carregue `.env` e sobrescreva configurações dos testes:

```powershell
$env:ADK_DISABLE_LOAD_DOTENV = '1'
uv run --locked pytest -q --tb=short -p no:cacheprovider
Remove-Item Env:ADK_DISABLE_LOAD_DOTENV
uv run --locked ruff check .
uv run --locked ruff format --check .
```

Em **21/11/2026**, a suíte isolada concluiu com **286 aprovados e 6 ignorados**.
Sem o isolamento, houve **285 aprovados, 1 falha e 6 ignorados**, por interferência
do `.env` no teste do limite de chamadas. O lint passou; a formatação global apontou
uma pendência preexistente em `data/databricks_client.py`, preservada nesta issue.

Integração real Databricks, com `.env` configurado (faz consultas ao warehouse):

```powershell
$env:RUN_DATABRICKS_INTEGRATION = '1'
uv run --locked --env-file .env pytest agente_horizonte/tests/integration/test_databricks.py -q --show-capture=no
Remove-Item Env:RUN_DATABRICKS_INTEGRATION
```

As seis Evals nativas de atendimento podem ser executadas na aba **Evals** ou pelo
CLI abaixo, com Databricks e Gemini reais. Consomem a quota da conta:

```powershell
$env:PYTHONUTF8 = '1'
uv run --locked --env-file .env adk eval agente_horizonte agente_horizonte/customer_support.evalset.json --config_file_path agente_horizonte/test_config.json --print_detailed_results
```

Os resultados atuais, evidências históricas de integrações reais e limites das
métricas estão na [documentação técnica](../docs/ai/DOCUMENTACAO_TECNICA.md#8-testes-e-validação).
