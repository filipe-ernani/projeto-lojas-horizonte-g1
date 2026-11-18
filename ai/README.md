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
