# Matriz de acessos (IAM)

Quem acessa o quê na plataforma de dados da Lojas Horizonte: como está no MVP (Databricks) e como fica no GCP. Complementa a seção de segurança e a decisão D22 (`docs/dados/decisoes.md`).

**Responsável:** Diego (Engenharia de Dados) · **Conferido em:** 21/11/2026

## 1. Princípios

| Princípio | Como aplicamos |
|---|---|
| Menor privilégio | Cada pessoa ou serviço recebe só o que a tarefa exige. Consumidores leem só a gold |
| Pessoas leem, serviços escrevem | Em produção, só as contas de serviço do pipeline gravam no BigQuery. Pessoas alteram dados mudando o código (PR), não as tabelas |
| A loja não depende da análise | A API não tem acesso ao BigQuery. O pipeline nunca escreve no banco da loja |
| Nenhuma credencial no Git | Tokens ficam em `.env` local (no `.gitignore`). Em produção, Secret Manager e contas de serviço anexadas aos serviços, sem chave baixada |
| Sem dados pessoais | Cliente identificado só por `usuario_hash` (sha256). A gold de avaliações não tem `usuario_hash` nem `pedido_id` (D25). Este documento não lista e-mails porque o repositório é público |

## 2. MVP: Databricks Free Edition (estado em 21/11)

| Quem | Permissões da ferramenta | bronze | silver | gold | Volume `landing` | Jobs |
|---|---|---|---|---|---|---|
| **Diego** · Eng. de Dados | Admin do workspace | Dono | Dono | Dono | Dono | Dono dos dois Jobs |
| **Henry** · BI (dashboard) | *Consumer* + *Databricks SQL access*; *Can use* no SQL warehouse | — | — | `USE SCHEMA`, `SELECT` | — | — |
| **Emanuel** · IA (agente ADK) | *Consumer* + *Databricks SQL access*; *Can use* no warehouse; *Can Use* em tokens | — | — | `USE SCHEMA`, `SELECT` | — | — |
| **Caio** · FullStack (carga ao vivo) · *previsto* | *Consumer* + *Databricks SQL access* | `USE SCHEMA` | — | — | `READ VOLUME`, `WRITE VOLUME` | *Can Manage Run* no `horizonte_site_ao_vivo` |
| **Filipe** · PMO | Sem acesso ao workspace (não precisa para as entregas dele) | — | — | — | — | — |
| **Jobs** `horizonte_pipeline` e `horizonte_site_ao_vivo` | Rodam com a identidade do dono (Diego) | Lê e grava | Lê e grava | Lê e grava | Lê | — |

Todos os consumidores também têm `USE CATALOG` no catálogo `horizonte`.

**Detalhes:**
- **Agente do Emanuel:** conecta no SQL warehouse com um token pessoal do próprio Emanuel, guardado no `.env` local. Herda só a leitura da gold, então uma consulta na silver falha. O token de teste do Diego foi revogado em 21/11.
- **Caio dispara, mas não acessa:** o `carga_ao_vivo.sh` só envia CSVs para `landing/site/api/` e dispara o Job ao vivo. Quem lê e grava silver e gold é o Job, com a identidade do dono. O Caio não precisa de acesso a essas camadas.
- **Dashboard do Henry:** lê a gold e as views `gold.dim_data` e `gold.dim_loja`, que expõem só o necessário da silver (D24).

**Como foi conferido (21/11):**
- `SHOW GRANTS` no catálogo, nos três schemas e no Volume: só Henry e Emanuel aparecem, com `USE CATALOG` e, na gold, `USE SCHEMA` + `SELECT`. Bronze, silver e Volume voltam vazios.
- `databricks users list --attributes "userName,entitlements"`: Henry e Emanuel com `databricks-sql-access` e `workspace-consume`, sem `workspace-access`.

**Limitações do Free Edition:**
- A permissão vale para o Volume inteiro, não para uma pasta. Em produção, a API teria um bucket (ou Volume) só dela.
- Usuários adicionados não podem ser removidos da conta.
- As consultas de todos usam a cota de compute do workspace do Diego.
- Os Jobs rodam como uma pessoa. Em produção, rodariam como uma conta de serviço (no Databricks, um *service principal*).

## 3. Produção: GCP

### 3.1 Pessoas (por grupo do Google Workspace)

Permissão dada ao grupo, nunca à pessoa: quando alguém entra ou sai do time, muda só o grupo.

| Grupo | Papéis | Onde | Para quê |
|---|---|---|---|
| `dados@` · Eng. de Dados | `roles/bigquery.dataViewer` | Datasets `bronze`, `silver`, `gold` | Investigar dados em qualquer camada |
| | `roles/bigquery.jobUser` | Projeto | Executar consultas |
| | `roles/dataform.editor` | Repositório do Dataform | Editar e executar as transformações (código revisado por PR) |
| `bi@` · BI | `roles/bigquery.dataViewer` | Dataset `gold` | Montar dashboards e relatórios |
| | `roles/bigquery.jobUser` | Projeto | Executar consultas |
| `diretoria@` | Leitor do relatório no Looker Studio e da planilha | Compartilhamento do arquivo | Ver os indicadores, sem acesso ao BigQuery |
| `operacao@` · FullStack e PMO | `roles/monitoring.viewer`, `roles/logging.viewer` | Projeto | Acompanhar alertas e incidentes |
| `pmo@` | `roles/billing.viewer` + alerta de orçamento | Conta de faturamento | Acompanhar custos |

### 3.2 Contas de serviço

| Conta de serviço | Papéis | Onde | Para quê |
|---|---|---|---|
| `sa-api` (Cloud Run da loja) | `roles/cloudsql.client` | Projeto | Conectar no Cloud SQL |
| | `roles/secretmanager.secretAccessor` | Segredo da senha do banco | Ler a senha sem ela estar no código |
| | `roles/aiplatform.user` | Projeto | Chamar o agente no chat da vitrine |
| `sa-erp` (exportação do ERP) | `roles/storage.objectCreator` | Bucket de entrada, pasta do ERP | Só criar arquivos: não lê nem apaga |
| Conta do Datastream | `roles/bigquery.dataEditor` | Dataset `bronze` | Gravar as mudanças do Cloud SQL |
| `sa-dataform` (pipeline) | `roles/bigquery.dataEditor` | Datasets `bronze`, `silver`, `gold` | Criar e atualizar as tabelas |
| | `roles/bigquery.jobUser` | Projeto | Executar as transformações |
| | `roles/storage.objectViewer` | Bucket de entrada | Ler os arquivos das tabelas externas |
| `sa-agente` (Vertex AI Agent Engine) | `roles/bigquery.dataViewer` | Tabelas `gold_catalogo` e `gold_avaliacoes` | Buscar produtos e avaliações (RAG) |
| | `roles/bigquery.jobUser` | Projeto | Executar consultas |
| | `roles/aiplatform.user` | Projeto | Usar o modelo Gemini |
| `sa-relatorio` (atualiza a planilha) | `roles/bigquery.dataViewer` + `roles/bigquery.jobUser` | Dataset `gold` e projeto | Ler os indicadores |
| | Editor da planilha | Compartilhamento do Sheets | Escrever o relatório da diretoria |

**Repare:** a `sa-api` não tem nenhum papel no BigQuery, e nenhuma conta do pipeline tem acesso ao Cloud SQL além do Datastream (que só lê o log). Se a plataforma de dados cair, a loja continua vendendo.

### 3.3 Do MVP ao GCP

| No MVP (Databricks) | No GCP | O que melhora |
|---|---|---|
| `USE SCHEMA` + `SELECT` na gold | `roles/bigquery.dataViewer` no dataset `gold` | Mesmo conceito |
| *Can use* no SQL warehouse | `roles/bigquery.jobUser` no projeto | Mesmo conceito |
| Views `gold.dim_data` e `gold.dim_loja` sobre a silver | *Authorized views* | Mesmo conceito |
| Token pessoal do Emanuel no agente | `sa-agente` anexada ao Agent Engine, só nas duas tabelas | Sem credencial pessoal, acesso por tabela |
| `WRITE VOLUME` no Volume inteiro (Caio) | Datastream + `sa-erp` com `objectCreator` só na pasta dela | Acesso mais estreito, sem pessoa no caminho |
| Job rodando como o Diego | `sa-dataform` | O pipeline não depende da conta de uma pessoa |
| Usuários adicionados um a um | Grupos do Google Workspace | Entrada e saída do time sem refazer permissões |

## 4. Como conferir

No MVP (SQL Editor):
```sql
SHOW GRANTS ON CATALOG horizonte;
SHOW GRANTS ON SCHEMA horizonte.bronze;
SHOW GRANTS ON SCHEMA horizonte.silver;
SHOW GRANTS ON SCHEMA horizonte.gold;
SHOW GRANTS ON VOLUME horizonte.bronze.landing;
```

No GCP:
```bash
bq show --format=prettyjson lojas-horizonte:gold | grep -A3 '"role"'
gcloud projects get-iam-policy lojas-horizonte --format="table(bindings.role, bindings.members)"
```
