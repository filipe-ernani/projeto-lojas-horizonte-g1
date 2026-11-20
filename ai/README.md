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
| `DATABRICKS_REVIEWS_TABLE` | Nome completo da tabela tratada de reviews; fonte atual: `workspace.default.reviews_atualizado` |
| `DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN` | Chave de produto nos reviews; fonte atual: `sku` |
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

## IA-02: preparação para recuperação lexical

As funções `build_product_documents` e `build_review_documents` em
`retrieval/document_loader.py` recebem os registros já consultados, sem acesso à rede.
O catálogo usa `nome`, `modelo`, `categoria` e `grupo`, colunas
verificadas no Databricks em 16/11/2026. Preço, custo e popularidade permanecem na
referência de origem e não são utilizados como texto de recuperação.

```python
import os

from agente_horizonte.data.databricks_client import fetch_products
from agente_horizonte.retrieval.document_loader import build_product_documents
from agente_horizonte.retrieval.preprocessing import tokenize

documents = build_product_documents(
    fetch_products(limit=1000),
    source=os.environ["DATABRICKS_CATALOG_TABLE"].strip(),
    product_id_field=os.environ["DATABRICKS_CATALOG_PRODUCT_ID_COLUMN"].strip(),
)
corpus = [document["tokens"] for document in documents]
query_tokens = tokenize("Tênis azul")
```

Cada documento contém `product_id`, `type` (`product` ou `review`), `text`, `tokens`
e `source`. A origem guarda o nome da tabela e uma cópia da linha original, incluindo
SKU, identificadores de avaliação/pedido e demais campos disponíveis. Identificadores
e valores originais não são normalizados; os registros de entrada não são alterados.
O corpus é uma `list[list[str]]` pronta para BM25: sua posição corresponde à posição
do documento e permite recuperar a origem de cada resultado. O índice e a busca BM25
são implementados na IA-03, descrita abaixo.

`normalize_text` e `tokenize` aplicam minúsculas, removem acentos e transformam
pontuação, sublinhados e espaços consecutivos em separadores. Preservam números,
repetições e palavras como “não”. Use `tokenize` também nas consultas. Textos nulos,
vazios ou compostos somente de pontuação produzem `[]`; documentos sem tokens ou
sem identificador textual válido são omitidos. Campos não textuais não viram palavras.

A fonte atualizada em 18/11/2026, `workspace.default.reviews_atualizado`, contém
`review_id`, `sku`, `nome_produto`, `nome_autor`, `nota`, `comentario` e `data_review`.
`build_review_documents` recebe os nomes das colunas de produto (`product_id_field`)
e texto (`text_fields`), além da tabela de origem (`source`). Para essa fonte, use
`review_id_field="review_id"`: o ID textual original é preservado no documento, no
resultado da busca e na linha de origem, enquanto `product_id` continua sendo o SKU.
IDs ausentes e vínculos conflitantes para o mesmo ID são descartados. Fontes sem ID
podem informar `review_id_field=None`, sem inventar identificadores. Os documentos
podem ser concatenados aos de produto.

Reviews com apenas nota são omitidos do índice textual, mas suas notas válidas
participam da média do produto. Um título textual é suficiente para indexação. Não há join nem
inferência de SKU pelo pedido. Vínculos ausentes, vazios ou com múltiplos SKUs são
descartados. Quando uma coluna de ID da avaliação é fornecida, IDs ausentes também
são descartados. Se a mesma avaliação aparecer vinculada a SKUs diferentes no mesmo lote,
todas as suas linhas são descartadas, mesmo quando uma delas não contém comentário.
A verificação de conflitos considera somente o lote recebido: a fonte precisa fornecer
vínculos inequívocos e o lote completo de avaliações antes de eventual paginação.
Identificadores de reviews, quando disponíveis, e produtos devem ser strings, como o
SKU do catálogo atual. Sem ID de avaliação não é possível detectar o mesmo review
repetido em linhas com SKUs diferentes; utiliza-se o vínculo explícito da fonte tratada.

Os testes unitários cobrem normalização, entradas vazias/nulas, conteúdo e origem dos
documentos, reviews sem texto, vínculos ambíguos e alinhamento do corpus. Para validar
a preparação com o catálogo real, habilite `RUN_DATABRICKS_INTEGRATION=1` e execute:

```powershell
uv run --env-file .env pytest tests/integration/test_databricks.py::test_catalog_prepares_real_documents --show-capture=no
```

Os testes unitários utilizam registros em memória; a validação real da tabela de reviews
é descrita na atualização de 18/11/2026 ao final deste documento.

Validação da IA-02 em **16/11/2026**: **92 testes unitários passaram** (44 novos);
os três testes de integração foram ignorados na execução padrão. Executado
separadamente, o teste de preparação com o catálogo real **passou**. `ruff check .`
e a formatação dos arquivos desta issue passaram. A checagem global de formatação
aponta pendências preexistentes em `config.py` e `data/databricks_client.py`, preservados.

## IA-03: recuperação lexical com BM25

### Teste manual no terminal

Com o `.env` preenchido, execute a partir de `ai/`:

```powershell
uv run --env-file .env python search.py
```

O comando carrega o catálogo real uma vez e abre o prompt `Busca:`. Digite o nome,
modelo, categoria ou características presentes no catálogo, por exemplo `tênis azul`.
Cada resultado mostra nome, ID, conteúdo pesquisado e score. Digite `sair` ou pressione
Ctrl+C para encerrar. Ajuste `BM25_TOP_K` no `.env` para mudar o limite de resultados.
As consultas seguintes reutilizam o índice, sem acessar novamente o Databricks.

Para incluir os comentários reais da tabela de reviews:

```powershell
uv run --env-file .env python -X utf8 search.py --reviews
```

A inicialização informa separadamente a quantidade de produtos e reviews indexados.
Busque um trecho de um comentário: resultados com `Tipo: review` vêm das avaliações;
`Tipo: product` indica o catálogo. Cada review exibe seu próprio ID e o SKU do produto.
A opção usa `review_id` como identificador e `comentario` como texto da fonte atual.
É necessário configurar `DATABRICKS_REVIEWS_TABLE` com três partes e
`DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN=sku` no `.env`.

Esta busca é lexical: retorna itens que compartilham termos com a consulta. Não há
interpretação por Gemini, expansão de sinônimos ou garantia de corresponder a todos os
termos digitados. Se a carga falhar, verifique a conexão e a configuração do Databricks.

### Uso em Python

`retrieval/bm25.py` utiliza `BM25Okapi` da biblioteca
[rank-bm25](https://github.com/dorianbrown/rank_bm25). O índice e os documentos
ficam em memória, sem embeddings, banco vetorial, Gemini ou ADK. A classe mantém apenas
o estado do corpus e do índice; não há gerenciador ou camada adicional de serviços.

Execute `uv sync --locked` após atualizar as dependências. A aplicação consumidora deve
construir o recuperador uma vez na inicialização e reutilizá-lo nas consultas:

```python
from agente_horizonte.config import bm25_top_k
from agente_horizonte.retrieval.bm25 import BM25Retriever
from agente_horizonte.retrieval.document_loader import load_documents_from_databricks

# Carga completa do catálogo real, usando as variáveis Databricks já existentes.
retriever = BM25Retriever(load_documents_from_databricks(), top_k=bm25_top_k())

results = retriever.search("Tênis azul")
results = retriever.search("Tênis azul", top_k=3)

# Reconstrução completa explícita, quando os dados forem atualizados.
retriever.rebuild(load_documents_from_databricks())
```

Carregue o ambiente com `uv run --env-file .env ...` ao executar seu código consumidor.
`BM25_TOP_K` define o limite padrão (5). O argumento `top_k` de `search` substitui esse
limite somente naquela consulta; ambos exigem inteiro positivo. O recuperador também
aceita diretamente os documentos processados pela IA-02, sem conexão externa.

Cada resultado contém `product_id`, `type`, `text`, `source` e `score` (`float`).
Resultados de reviews preparados com ID incluem também `review_id`.
O conteúdo é o texto normalizado; `source` preserva a tabela e a linha original,
incluindo o identificador da avaliação quando disponível na fonte. Produtos e
reviews são documentos separados, podendo compartilhar o mesmo `product_id`.
O retorno contém até Top-K documentos com pelo menos um termo da consulta e vem em
ordem decrescente de score na busca padrão. Empates preservam a ordem do corpus carregado.
Produtos carregados com reviews incluem também `average_rating` e `review_count`.

Corpus e consultas usam a mesma tokenização da IA-02. Consultas vazias, compostas
somente de pontuação ou sem termos presentes no corpus retornam `[]` na busca padrão. Corpus vazio
também retorna `[]`; documentos sem tokens são ignorados na indexação. Scores zero
ou negativos podem ocorrer com o cálculo de IDF da biblioteca, sobretudo em corpus
pequenos; não são usados como filtro de ausência de correspondência. O score expressa
relevância lexical, não nota de avaliação nem qualidade do produto.

`load_documents_from_databricks` reutiliza as consultas existentes com `limit=None`
para carregar o catálogo completo. Não consulta o Databricks durante `search`. Não há
reconstrução automática por pergunta, persistência em disco ou atualização incremental.
Falhas de configuração, conexão e consulta são propagadas; falhas durante uma recarga
ou construção mantêm o índice anterior. Uma recarga bem-sucedida com corpus vazio
limpa o índice. A carga completa precisa caber na memória e na quota do warehouse.

Por padrão, o carregador inclui somente o catálogo. Para incluir reviews, configure
as duas variáveis Databricks de reviews e forneça os campos de ID e texto. A fonte
atual usa `review_id` e `comentario`:

```python
documents = load_documents_from_databricks(
    review_id_field="review_id",
    review_text_fields=("comentario",),
)
retriever.rebuild(documents)
```

A chave de produto vem de `DATABRICKS_REVIEWS_PRODUCT_ID_COLUMN`; nenhum vínculo por
pedido é inferido. Aplicam-se as regras da IA-02 para descartar reviews sem texto ou
com vínculo ambíguo. Se a fonte tiver ID da avaliação, informe também `review_id_field`;
IDs ausentes ou conflitantes serão descartados. Informar um ID sem campos de texto,
ou solicitar reviews sem configuração da tabela, gera erro sem substituir o índice.

Os testes unitários validam ranking, busca em produtos/reviews, IDs e origem, Top-K,
consultas sem resultados, corpus vazio, scores zero/negativos, reconstrução e falhas
de recarga. Os acessos externos nesses testes são mocks. Para validar carga, busca e
reconstrução do catálogo real, habilite `RUN_DATABRICKS_INTEGRATION=1` e execute:

```powershell
uv run --env-file .env pytest tests/integration/test_databricks.py::test_catalog_bm25_search_and_rebuild_real_data --show-capture=no
```

A integração com o agente e sua inicialização pertence à IA-04; o recuperador está
disponível como módulo Python nesta issue. As evidências abaixo registram as execuções
e a disponibilidade dos dados em cada data.

Validação da IA-03 em **16/11/2026**, com Python 3.12.14 e `rank-bm25` 0.2.2:

- `uv run --locked pytest`: **126 passaram e 4 foram ignorados** (integrações reais
  desabilitadas nessa execução). São 34 testes unitários novos nesta issue.
- Integração real: **2 passaram, 1 falhou e 1 foi ignorado**. A preparação de documentos
  e o novo teste de carga, busca BM25 e reconstrução com o catálogo real passaram.
  O teste preexistente de leitura/filtros falhou no handshake SSL
  (`UNEXPECTED_EOF_WHILE_READING`), inclusive na repetição isolada. Reviews foram
  ignorados por ausência do contrato/tabela; não foram validados com dados reais.
- `uv run --locked ruff check .`: passou. A formatação dos seis arquivos Python
  alterados/criados passou. `uv run --locked ruff format --check .` ainda aponta
  somente a pendência preexistente em `data/databricks_client.py`, preservada.

A falha SSL do teste preexistente permanece como risco da conexão ao ambiente real;
o cliente Databricks não foi alterado nesta issue. Na execução de 16/11/2026, a entrega
dos reviews e a análise dessa falha ainda eram necessárias para completar a integração.

### Testar o acesso aos reviews

A partir de `ai/`, com o `.env` preenchido:

```powershell
$env:RUN_DATABRICKS_INTEGRATION = '1'
uv run --env-file .env pytest tests/integration/test_databricks.py -k reviews -v --show-capture=no
$env:RUN_DATABRICKS_INTEGRATION = '0'
```

`test_reviews_read_and_filter_real_records` verifica acesso à tabela, leitura dos
registros, filtros por SKU e categoria e vínculo ao catálogo.
`test_reviews_bm25_search_and_rebuild_real_data` verifica preparação dos comentários,
presença dos SKUs no catálogo, unicidade e preservação de `review_id`, busca de reviews
reais, origem dos resultados e reconstrução do índice após nova carga. Os dois testes
devem passar.

Validação inicial em **18/11/2026**, antes da inclusão do ID da avaliação:

- Nome completo da tabela confirmado no Databricks e corrigido no `.env` local:
  `workspace.default.reviews_10_porcento`, com chave de produto `sku`.
- **128 testes unitários passaram**, incluindo a fonte sem ID próprio da avaliação.
- Os dois testes reais de reviews **passaram**, cobrindo acesso, filtros, associação
  ao catálogo, recuperação BM25 e reconstrução do índice.
- O comando `search.py --reviews` carregou **200 produtos e 20 reviews**. A consulta
  `qualidade` retornou avaliações, incluindo o SKU `HZ-INF-020`, com o conteúdo
  `chegou certinho qualidade boa pelo preco`. Uma consulta sem correspondência retornou
  `Nenhum item encontrado.`
- Ruff e a formatação dos quatro arquivos Python alterados nesta atualização passaram.
  Os demais testes reais do catálogo não foram repetidos nesta atualização; a falha
  SSL registrada em 16/11/2026 permanece como histórico daquela execução.

Atualização em **18/11/2026**, após a inclusão de `review_id`:

- A tabela `workspace.default.reviews_atualizado` foi consultada e a coluna
  `review_id` confirmada como texto. O comando `--reviews` agora informa essa coluna
  ao carregador, ativando a validação dos IDs e de seus vínculos ao SKU.
- Os documentos e resultados preservam `review_id` como campo próprio. O terminal
  exibe separadamente o SKU do produto e o ID da avaliação.
- **128 testes unitários e os dois testes reais de reviews passaram**. A integração
  verificou unicidade e preservação dos IDs, busca e reconstrução do índice.
- O teste manual carregou **200 produtos e 20 reviews**. A consulta `qualidade`
  retornou, entre outros, `review_id=REV-2727783B`, associado ao SKU `HZ-CAL-020`.
- Ruff, formatação dos seis arquivos Python alterados e `git diff --check` passaram.

### Buscar produtos com maiores notas

A regra escolhida é a **média das avaliações de cada SKU**, acompanhada da quantidade
de reviews. Não se usa a maior nota isolada nem o score BM25 como nota do produto.
A média é calculada uma vez na carga, usando a coluna `nota` dos reviews válidos,
inclusive avaliações sem comentário. IDs repetidos contam uma vez; vínculos ambíguos,
IDs ausentes e notas inválidas são excluídos. São válidas notas numéricas finitas de
1 a 5. Produtos sem notas ficam com `average_rating=None` e `review_count=0`.

Para pedir a ordenação durante a busca interativa:

```powershell
uv run --env-file .env python -X utf8 search.py --reviews
```

Exemplos no prompt:

```text
Busca: bermuda com maiores notas
Busca: calçados mais bem avaliados
Busca: maiores notas
```

As expressões `maiores notas`, `melhores notas` e `mais bem avaliados` ativam a
ordenação e são removidas do texto pesquisado. Sem essas expressões, a busca mantém
o ranking BM25 normal. O comando mostra a média e a quantidade de avaliações dos
produtos, além da nota individual quando o resultado normal é um review.

Também é possível ativar a ordenação para todas as consultas:

```powershell
uv run --env-file .env python -X utf8 search.py --best-rated
```

Essa opção já inclui a carga dos reviews. Em Python, use:

```python
results = retriever.search("bermuda", sort_by_rating=True, top_k=5)
best_rated = retriever.search("", sort_by_rating=True, top_k=5)
```

Nesse modo, o retorno contém somente produtos do catálogo que tenham nota e
correspondam a pelo menos um termo da consulta. Uma consulta vazia lista os mais
bem avaliados do catálogo disponível. A ordenação usa a média decrescente e, em
empates, o score BM25. O Top-K é aplicado **depois** dessa ordenação. Reviews não
aparecem como produtos duplicados; produtos sem nota não entram nesse ranking.

O cálculo se limita às avaliações presentes na tabela configurada. Na fonte
consultada em 18/11/2026, os 20 SKUs avaliados tinham um review cada. Não são
inferidas avaliações para os demais produtos.

Para validar também as médias e o ranking contra os registros reais:

```powershell
$env:RUN_DATABRICKS_INTEGRATION = '1'
uv run --env-file .env pytest tests/integration/test_databricks.py -k 'reviews or rating' -v --show-capture=no
$env:RUN_DATABRICKS_INTEGRATION = '0'
```

Validação da ordenação por nota em **18/11/2026**:

- **145 testes unitários passaram**, cobrindo médias, contagem, notas sem comentário,
  IDs duplicados/ambíguos, notas inválidas, Top-K após ordenação e pedidos por nota.
- Os **três testes reais de reviews e notas passaram**. As médias e quantidades dos
  produtos retornados foram conferidas com as linhas originais do Databricks.
- No teste interativo, `bermuda com maiores notas` retornou os SKUs `HZ-MAS-004`,
  `HZ-MAS-008` e `HZ-ESP-005`, nessa ordem, com médias **5, 3 e 1**, respectivamente.
  `maiores notas` listou os cinco produtos com média 5; `qualidade` manteve a busca
  lexical normal e mostrou a nota individual de cada review.
- Ruff, formatação dos seis arquivos Python alterados e `git diff --check` passaram.

## IA-04: agente de atendimento com ADK e Gemini

`agente_horizonte/agent.py` expõe um único `root_agent`, descoberto pelo Google ADK.
Na carga do agente, `tools.initialize_index()` reutiliza o carregador existente para
obter catálogo e reviews uma vez e construir o BM25 em memória. O contrato atual dos
reviews usa `review_id`, `comentario` e `nota`, com SKU definido na configuração
existente. As tabelas e colunas do catálogo e dos reviews precisam estar configuradas.
As perguntas seguintes não consultam o Databricks.

### Configuração e execução

A partir de `ai/`, preserve o `.env` existente e acrescente as variáveis da seção
Gemini de `.env.example`:

| Variável | Finalidade |
| --- | --- |
| `GOOGLE_API_KEY` | Chave do [Google AI Studio](https://aistudio.google.com/api-keys); obrigatória |
| `GEMINI_MODEL` | ID do modelo Gemini principal; obrigatório |
| `GEMINI_MODEL_FALLBACK_1` | ID do primeiro modelo alternativo; opcional |
| `GEMINI_MODEL_FALLBACK_2` | ID do segundo modelo alternativo; opcional |
| `GOOGLE_GENAI_USE_VERTEXAI` | Manter `FALSE`; este MVP utiliza a API key do AI Studio |
| `GEMINI_MAX_ATTEMPTS_PER_MODEL` | Entre 1 e 3 tentativas por modelo; padrão 2 |

Escolha IDs com suporte a chamadas de ferramentas no
[catálogo oficial Gemini](https://ai.google.dev/gemini-api/docs/models) e confirme o
acesso na conta utilizada. Não há um modelo fixo no código. Não compartilhe a chave
pelo chat, logs ou Git. Configuração Gemini ausente ou inválida impede a carga do
agente, com indicação da variável a corrigir.

Use um único ID por variável. A ordem é `GEMINI_MODEL` → `GEMINI_MODEL_FALLBACK_1`
→ `GEMINI_MODEL_FALLBACK_2`; alternativas vazias são ignoradas. Para executar apenas
o principal, deixe os dois fallbacks vazios. A configuração antiga `GEMINI_MODELS`
não é mais lida: distribua seus modelos entre as três variáveis de `.env.example`.

```powershell
uv sync --locked
uv run --locked --env-file .env adk web --host 127.0.0.1 --port 8000 --no-reload .
```

Abra `http://127.0.0.1:8000`, selecione `agente_horizonte` e envie uma pergunta. O
ADK carrega o agente e seus dados na primeira utilização; o warehouse pode demorar
a iniciar. Aguarde essa carga antes de avaliar a resposta. O modo sem reload evita
recargas durante a validação. Para atualizar o corpus, reinicie o servidor ou chame
`tools.initialize_index()` explicitamente em Python; essa operação não é uma
ferramenta acessível ao modelo.

O ADK mantém seus arquivos locais em `.adk/`, ignorado pelo Git para
evitar versionar sessões, artefatos e traces gerados durante o desenvolvimento.

### Ferramentas e comportamento

- `search_products(query, sort_by_rating=False)` aplica a busca BM25 existente com
  `BM25_TOP_K`. Retorna `status` e `results` com `product_name`, atributos públicos,
  comentários, score e médias de avaliações quando disponíveis. A ordenação por nota
  é usada apenas quando pedida. SKU, IDs de comentários e linhas brutas de origem
  não fazem parte desse retorno.
- `get_product_details(product_name)` procura o nome completo do catálogo, ignorando
  diferenças de caixa, acentos e pontuação. Retorna os atributos públicos e os
  comentários vinculados internamente ao produto. Para nomes parciais, o agente usa
  primeiro a busca BM25; nomes iguais exigem esclarecimento por atributos disponíveis.
  Notas sem comentário participam da média calculada pelo carregador; não viram
  comentários inventados.
- Os retornos são serializáveis em JSON. Preços `Decimal` e datas de origem são
  representados como texto, preservando seu valor sem inventar moeda ou atualização.
- `status=no_results` significa ausência de correspondências. `status=unavailable`
  significa que a carga inicial falhou. As instruções exigem explicitar a diferença
  e não inventar produtos, atributos ou avaliações. A falha de uma recarga explícita
  preserva o índice anterior; a carga bem-sucedida vazia limpa os resultados.
- `status=invalid_query` orienta consultar pelo nome quando a ferramenta recebe um
  código interno. O callback `require_product_name` também bloqueia mensagens com
  esses códigos antes de chamar o Gemini, sem repeti-los na resposta.

As instruções em `prompt.py` orientam respostas em português, perguntas de esclarecimento,
recomendações por requisitos verificáveis e comparações com consulta individual de
cada produto. Produtos recomendados ou comparados são identificados pelo nome do
catálogo. SKU e IDs de comentários são exclusivamente internos: não devem ser
solicitados, aceitos como consulta ou exibidos nas respostas. A camada de ferramentas
seleciona campos públicos; códigos presentes em comentários são ocultados. O callback
`hide_internal_ids` também oculta códigos reconhecidos em textos gerados pelo modelo.
Os IDs continuam no carregador e no recuperador para vincular avaliações corretamente;
os módulos internos e o utilitário técnico `search.py` não são a interface do cliente.
Textos recuperados são tratados como dados, sem autoridade para alterar as instruções.
BM25 mede correspondência lexical; encontrar uma palavra não comprova todos os
requisitos do cliente. Características ausentes devem ser declaradas indisponíveis.
A fundamentação das respostas ainda depende do comportamento do Gemini e precisa
ser conferida nos testes reais, além dos testes determinísticos das ferramentas.

### Fallback e limites

`models.GeminiFallback` é um adaptador **próprio** baseado em `BaseLlm`, ponto de
extensão do ADK; a troca de modelos não usa uma função pronta de fallback do ADK.
O `retry_options` do Gemini permite novas tentativas no mesmo modelo. A sequência
entre modelos é controlada pelo adaptador, sem criar outro agente.
Cada chamada começa pelo primeiro modelo configurado.
Somente erros HTTP 408, 429, 500, 502, 503 e 504 acionam novas tentativas e troca de
modelo, com espera de um segundo entre tentativas. Os retries internos do SDK são
desabilitados (`attempts=1`) e cada requisição tem timeout de 30 segundos. O limite
total de tentativas é a quantidade de modelos multiplicada pelo limite por modelo.
Não há garantia de contornar quotas compartilhadas.

Erros de credenciais, permissão, modelo inexistente e requisição inválida encerram
a chamada sem fallback. Respostas bloqueadas por segurança também não acionam troca
de modelo. Se uma resposta em streaming já começou, uma falha não repete a geração.
Cada tentativa usa uma cópia da requisição para preservar o histórico. Os logs da
aplicação registram modelo, tentativa e código HTTP, sem o conteúdo do erro da API.

### Validação

```powershell
uv run --locked pytest
uv run --locked ruff check .
uv run --locked ruff format --check .
```

`tests/unit/test_agent.py` usa corpus sintético e exercita ferramentas, nomes, notas,
JSON, falhas/recarga e descoberta do agente. Também executa o `Runner` real do ADK
com respostas Gemini simuladas para conferir que os resultados das ferramentas
chegam à próxima chamada do modelo, inclusive em comparações e ausência de resultados.
Confere ainda a ausência de IDs nos retornos, a ocultação de códigos em comentários
e respostas geradas e o bloqueio de consultas por códigos antes de chamar o Gemini.
Isso não comprova a qualidade de uma resposta gerada pelo Gemini real.
`tests/unit/test_models.py` cobre configuração, ordem e limites do fallback, falhas
definitivas, bloqueio de segurança, preservação da requisição e falha após início do
streaming. Os testes unitários não fazem chamadas externas.

Para validar no `adk web`, confira os eventos de ferramenta e a resposta final:

1. Busque um produto pela categoria e consulte suas características e avaliações.
2. Peça uma recomendação com requisito verificável, como faixa de preço ou maiores notas.
3. Compare dois produtos pelo nome, verificando atributos e avaliações sem códigos internos.
4. Consulte um termo inexistente e uma característica ausente; confira que não há invenção.
5. Envie um código interno; confira que o agente solicita o nome sem repetir o código.

Exemplos: “Quais são as avaliações da Bermuda Masculino Malha Vinho?” e
“Compare Bermuda Masculino Malha Vinho e Bermuda Masculino Linho Off-white”.
Após atualizar esta versão, reinicie o servidor e abra uma nova sessão para não
reutilizar o histórico do comportamento anterior, que incluía identificadores.

Referências: [ADK Python e execução web](https://google.github.io/adk-docs/get-started/python/),
[ferramentas de função](https://google.github.io/adk-docs/tools-custom/function-tools/)
e [implementação Gemini no ADK 1.39.1](https://github.com/google/adk-python/blob/v1.39.1/src/google/adk/models/google_llm.py).

Evidências históricas da IA-04 em **18/11/2026**, com Google ADK **1.39.1**
(anteriores à mudança para atendimento exclusivamente por nome):

- `uv run --locked pytest -q`: **193 passaram e 6 foram ignorados**. São 48 testes
  novos; as seis integrações reais são desabilitadas por padrão e não foram executadas
  nessa suíte. O Gemini foi simulado nos testes unitários.
- `uv run --locked ruff check .`: passou. A formatação dos sete arquivos Python da
  IA-04 passou. A verificação global de formatação aponta somente a pendência
  preexistente em `data/databricks_client.py`, mantida fora do escopo.
- As ferramentas foram executadas separadamente com uma carga real do Databricks:
  busca por `bermuda` ordenada por nota retornou `HZ-MAS-004` (5), `HZ-MAS-008` (3)
  e `HZ-ESP-005` (1), cada um com uma avaliação. A consulta exata de `HZ-MAS-004`
  retornou o documento do catálogo e seu review. `zzzinexistentexyz` retornou
  `no_results`. Essa execução não utilizou Gemini.
- O servidor `adk web` iniciou em `127.0.0.1:8000`; a interface foi aberta em Chrome
  isolado e `agente_horizonte` foi selecionado. Isso comprova a abertura da interface,
  mas **não** comprova uma conversa com o modelo.
- A configuração local ainda não continha `GOOGLE_API_KEY` e `GEMINI_MODELS` na
  verificação. A geração real de respostas e os cenários completos no `adk web`
  permanecem **bloqueados** até o preenchimento dessas variáveis e sua execução.

Atualização em **19/11/2026**, após a mudança solicitada para atendimento por nome:

- As instruções anteriores de exibir SKU foram substituídas pela orientação explícita
  do usuário: nomes no atendimento; SKU e IDs de comentários exclusivamente internos.
  As alterações ficaram em `agent.py`, `tools.py`, `prompt.py`, `test_agent.py` e
  neste README, sem alterar o carregador, o BM25 ou o fallback.
- `uv run --locked pytest -q`: **207 passaram e 6 foram ignorados**. Os testes novos
  verificam consultas por nome, normalização, nomes duplicados, vínculos internos,
  ausência de IDs nos retornos, ocultação em textos e bloqueio antes de chamar Gemini.
- `uv run --locked ruff check .` e a formatação dos quatro arquivos Python alterados:
  passaram. A pendência de formatação preexistente do cliente Databricks permanece
  fora do escopo. `git diff --check` passou.
- Validação real na interface `adk web`, em uma instância isolada na porta **8001**,
  com **Gemini 3.1 Flash-Lite** e dados reais do Databricks (**200 produtos e 20 reviews**):
  consulta de características/avaliações por nome, recomendação de bermudas por nota,
  comparação por nome, informação ausente e bloqueio de consulta por código funcionaram.
- A recomendação retornou **Bermuda Masculino Malha Vinho** (média 5, uma avaliação)
  e **Bermuda Masculino Linho Off-white** (média 3, uma avaliação). A comparação
  consultou ambos os nomes e apresentou atributos, preços e os comentários vinculados.
  Os retornos das ferramentas e as respostas geradas não expuseram SKU nem IDs de comentários.
- O produto sem informação de impermeabilidade/proteção UV foi descrito como sem
  dados suficientes para confirmar essas características. A consulta por código
  respondeu pedindo o nome, sem repetir o código. Um pedido explícito de SKU e ID
  de comentário também não revelou os identificadores.
- Durante a validação, uma consulta a nome inexistente inicialmente não acionou nova
  busca. A instrução foi reforçada para exigir consulta para cada nome novo. Após
  reiniciar o servidor, `zzzinexistentexyz3` acionou a ferramenta, retornou `no_results`
  e recebeu uma resposta informando a ausência de resultados, sem inventar alternativas.
- Houve uma falha HTTP **503** real no modelo principal durante a recomendação;
  a nova tentativa no mesmo modelo funcionou. A troca entre modelos continua coberta
  por mocks; não foi provocada indisponibilidade real para forçar essa troca.

| Critério da IA-04 (situação em 19/11/2026) | Situação e evidência |
| --- | --- |
| Agente ADK com Gemini | Atendido; respostas reais com Gemini 3.1 Flash-Lite no ADK Web |
| BM25 como ferramenta | Atendido; ferramentas verificadas com corpus sintético e Databricks real |
| Instruções contextualizadas e fundamentadas | Atendido nos cenários reais descritos acima, com conferência dos eventos das ferramentas |
| Consultas de produtos, características e avaliações | Atendido; consulta por nome recuperou atributos e comentário do produto |
| Recomendações por requisitos | Atendido no cenário de maiores notas, com médias e quantidades conferidas |
| Comparação por atributos e avaliações | Atendido; consulta individual por nome e comparação dos dados recuperados |
| Identificação nas recomendações e comparações | Atendido conforme alteração de 19/11/2026: nomes públicos, sem SKU ou IDs de comentários |
| Ausência de resultados sem inventar informações | Atendido nos cenários de nome inexistente e característica ausente; indisponibilidade coberta por mocks |
| Funcionamento na interface `adk web` | Atendido nos cenários reais executados na interface, além da descoberta e dos testes com Runner |

A validação com Gemini real deixou de estar bloqueada. As evidências representam
os cenários executados, sem garantir toda resposta possível de um modelo generativo.

### Prompt injection e uso de tokens

O [relatório de robustez](evaluation/robustness.md) registra os testes reais de
19/11/2026, os tokens reportados e as lacunas de controle de uso encontradas. Para
repetir o ensaio com limites externos de chamadas e saída:

```powershell
uv run --locked --env-file .env python -X utf8 -m evaluation.evaluate
```

Esses limites pertencem ao ensaio. O agente servido ainda não tem os limites de
entrada, saída e ferramentas sugeridos no relatório.
