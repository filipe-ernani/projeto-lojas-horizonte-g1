# IA-06 — Testes e avaliações nativas do ADK

Validação em **20/11/2026**, Windows, Python **3.12.14** e ADK **1.39.1**.
Alterações restritas a `ai/`, sem commits. `ai/AGENTS.md` está ausente;
o documento anexado foi consultado como referência, subordinado ao pedido do usuário.

## Organização e correção da descoberta

O ADK 1.39.1 lista todas as subpastas visíveis do diretório passado a `adk web`.
Antes da correção, `/list-apps` retornava `agente_horizonte`, `evaluation` e
`tests`, e `/apps/agente_horizonte/eval-sets` retornava uma lista vazia.

As pastas de apoio foram movidas para `agente_horizonte/tests/` e
`agente_horizonte/evaluation/`. Os imports, caminhos documentados e a configuração
Pytest foram atualizados. A suíte não foi apagada. Agora há apenas um agente listado,
sem servidor adicional ou alterações no carregador do ADK.

## Avaliações automáticas disponíveis na aba Evals

`agente_horizonte/customer_support.evalset.json` contém seis casos nativos:

| Caso | Comportamento esperado |
| --- | --- |
| `product_attributes` | Consultar detalhes e informar nome/cor do catálogo |
| `product_reviews` | Consultar detalhes e informar nota média/quantidade |
| `recommendation` | Recomendar a opção solicitada usando cor e avaliações disponíveis |
| `comparison` | Consultar cada produto separadamente e comparar tipo/cor |
| `no_results` | Pesquisar o termo inexistente e reconhecer a ausência de resultados |
| `insufficient_information` | Reconhecer a falta de estoque atual sem inferir a partir de vendas |

O conjunto aparece como **customer_support** em **agente_horizonte → Evals**.
Selecione os casos, abra **Run Evaluation**, configure
`tool_trajectory_avg_score=1.0` e `response_match_score=0.3` e clique em **Start**.
Não é necessário conversar manualmente ou criar sessões de referência.

As referências são expectativas de teste, não respostas de uma execução real.
A nota **4,52**, as **25 avaliações** e os nomes públicos vêm da confirmação do
catálogo registrada no README em 20/11/2026. Atualize as referências quando a fonte mudar.
Não foram inventados preços para montar as expectativas.

As métricas verificam a trajetória das ferramentas e similaridade textual ROUGE-1.
**ROUGE não certifica correção factual completa:** palavras semelhantes podem
ocultar um número errado. O limiar 0,3 tolera variações de redação e não representa
um percentual de precisão factual. Os testes Pytest continuam cobrindo dados,
vínculos, médias, erros e serialização de forma determinística.

A interface instalada envia métricas com nome/threshold e não carrega automaticamente
`test_config.json`. Por isso os dois limites precisam ser selecionados no diálogo;
a interface salva a seleção no navegador. Não são usadas rubricas avançadas que
dependem de uma configuração que esse diálogo não envia.

## CLI e histórico

O mesmo conjunto pode ser executado pelo CLI, a partir de `ai/`:

```powershell
uv sync --locked
$env:PYTHONUTF8 = '1'
uv run --locked --env-file .env adk eval agente_horizonte agente_horizonte/customer_support.evalset.json --config_file_path agente_horizonte/test_config.json --print_detailed_results
```

`test_config.json` versiona os mesmos thresholds para o CLI. O pacote expõe
`agent` sob demanda em `__init__.py`, como exigido pelo carregamento do comando,
sem antecipar consultas externas quando módulos unitários são importados.
O bootstrap também inclui o diretório do pacote no caminho de importação, pois
o executável `adk` não inclui automaticamente `ai/`. Isso foi validado em um
processo Python isolado, além do teste Click no processo do Pytest.

No Windows, `PYTHONUTF8=1` evita `UnicodeEncodeError` ao imprimir emojis nas
respostas. O primeiro lote real terminou as seis avaliações, mas falhou ao imprimir
a tabela detalhada em cp1252. A repetição em UTF-8 concluiu com código de saída zero.

Os resultados nativos ficam em `agente_horizonte/.adk/eval_history/`, ignorado pelo Git.
Os testes do próprio avaliador usam diretórios temporários para preservar o histórico
real do desenvolvedor. Use caminhos relativos no CLI: o parser desta versão separa
casos pelo caractere `:` e interpreta incorretamente a unidade de um caminho Windows
absoluto. O comando documentado e testado usa caminhos relativos.

## Testes e evidências

| Verificação | Resultado |
| --- | --- |
| Suíte Pytest com JUnit em `.cache/ia06-pytest.xml` | **264 passaram, 6 ignorados**, 60 avisos; 19,06 segundos |
| Integração real Databricks, com JUnit em `.cache/ia06-databricks.xml` | **6 passaram**, 55,69 segundos; filtros, documentos, BM25, reviews e médias |
| `uv run --locked ruff check .` | Aprovado |
| Formatação dos arquivos Python alterados/movidos | Aprovada |
| `git diff --check` | Aprovado |
| Formatação global | Pendência preexistente em `data/databricks_client.py`, preservada |

Os testes de regressão foram executados antes da correção e falharam nos dois
sintomas informados pelo usuário. Depois da correção:

- A listagem HTTP e o AgentLoader retornam apenas `agente_horizonte`.
- O endpoint nativo lista o conjunto e os seis casos, validando seu schema.
- O endpoint de execução usa o mesmo payload nome/threshold enviado pela interface.
- Uma resposta igual à referência recebe ROUGE 1 e aprovação; uma resposta
  incompatível recebe ROUGE 0 e reprovação. Os scores e status das métricas são
  verificados, além do status geral, para evitar aceitar um resultado não avaliado.
- O histórico nativo é gravado em JSON no diretório temporário do teste.
- O comando Click real `adk eval`, com relatório detalhado, executa o mesmo caso
  e imprime `Overall Eval Status: PASSED`.

Nessas verificações, somente Gemini e `sql.connect` foram simulados; o agente,
o carregador, as ferramentas, o BM25, a API, o avaliador e o cálculo das métricas
são reais. **Não representam uma avaliação do Gemini real.** O script de ensaio
real separado da implementação inicial foi substituído pelo conjunto nativo.

Os oito casos de relevância BM25 continuam em
`agente_horizonte/evaluation/questions.json`. A suíte também preserva os testes
de processamento, documentos, fallback, recomendação por nota, comparação,
ausência de resultados, informações insuficientes, API, CORS e SQLite.

## Execução real das Evals

O `.env` foi disponibilizado durante esta rodada. O conjunto foi executado com
**Gemini 3.1 Flash-Lite e Databricks reais**, sem mocks, carregando **1.385 documentos**.
As seis avaliações terminaram aprovadas nas métricas configuradas.

A revisão do primeiro lote identificou um **falso positivo de ROUGE**: o nome
histórico usado no segundo produto da comparação não existia no catálogo atual.
O agente informou corretamente a ausência do produto, mas a similaridade lexical
ainda passou do limiar. O caso foi corrigido para **Short Feminino Viscose Marrom**,
cujo nome, tipo `Short` e cor `Marrom` foram consultados no Databricks.
Os cenários de características e comparação foram repetidos em UTF-8; a comparação
passou a recuperar ambos os produtos e comparar seus atributos reais.

| Cenário final | Trajetória | ROUGE-1 | Situação |
| --- | ---: | ---: | --- |
| Características | 1,0 | 0,5882 | Aprovado |
| Avaliações | 1,0 | 0,6875 | Aprovado; média 4,52 e 25 avaliações confirmadas |
| Recomendação | 1,0 | 0,4932 | Aprovado |
| Comparação | 1,0 | 0,5306 | Aprovado com dois produtos presentes no catálogo |
| Sem resultados | 1,0 | 0,4878 | Aprovado |
| Informação insuficiente | 1,0 | 0,5000 | Aprovado; não inferiu estoque a partir de vendas |

Os resultados reais finais foram consolidados em um registro nativo com os seis
casos em `agente_horizonte/.adk/eval_history/`, para consulta na interface. Foram
reutilizados os resultados reais salvos; não foram criadas respostas simuladas
nesse histórico. O ADK gerou nomes de arquivos coincidentes para dois resultados
do primeiro lote no Windows; a consolidação também preserva o caso de atributos
obtido na repetição.

Esses resultados comprovam os cenários executados, não a precisão geral de qualquer
resposta futura. O falso positivo acima permanece registrado como limite da métrica,
sem mudança no agente para favorecer as avaliações.

## Critérios de aceite e bloqueios

| Critério | Situação |
| --- | --- |
| Unitários do processamento e BM25 | **Atendido** |
| Relevância em consultas predefinidas | **Atendido no corpus sintético** |
| Dúvidas de produtos/reviews | **Atendido nos cenários reais acima e nos testes determinísticos** |
| Recomendações e comparações | **Atendido nos cenários reais acima e nos testes determinísticos** |
| Ausência de resultados/informação insuficiente | **Atendido nas ferramentas/API e nos cenários reais acima** |
| Agente–ferramentas–Databricks | **Atendido com mocks e com o conjunto nativo real** |
| Registro de resultados/falhas/evidências | **Atendido neste relatório, JUnit e testes de histórico nativo** |
| Comunicação com aplicação web FullStack | **API validada; fluxo Express/frontend bloqueado** |

O `.env` inicialmente ausente foi disponibilizado, sem alterações ou exposição
das credenciais. O conjunto nativo requer configuração válida desses serviços e
pode consumir a quota da conta. As referências cadastradas não foram contabilizadas
como respostas reais; os resultados vieram da execução registrada acima.
Os seis testes do Databricks ignorados na suíte padrão foram executados separadamente
com `RUN_DATABRICKS_INTEGRATION=1` e todos passaram.

`backend/` e `frontend/` estão vazios; não foi possível validar o fluxo completo
navegador → Express → ADK. Não foram alteradas essas áreas.

## Dependências e falhas corrigidas

- Corrigido o import que impedia coletar `test_bm25.py`; o helper agora está em
  `agente_horizonte.tests.search`.
- Removidos os falsos agentes da descoberta pela movimentação dos arquivos de apoio.
- Criado o conjunto nativo que faltava à aba Evals.
- O motor nativo falhava com `ModuleNotFoundError: rouge_score`.
  Adicionados apenas `rouge-score` e `tabulate` ao grupo de desenvolvimento e
  atualizado o lockfile; não foi instalado todo o extra `google-adk[eval]`.
- A expectativa CORS foi ajustada para HTTP 403, retornado pelo ADK instalado.
- A formatação preexistente do cliente Databricks foi preservada.
- Corrigido o carregamento do pacote pelo executável CLI, com teste em processo isolado.
- Documentado UTF-8 no Windows e o falso positivo observado na comparação inicial.

Referências: [avaliação nativa do ADK](https://github.com/google/adk-docs/blob/main/docs/evaluate/index.md)
e [codelab oficial](https://codelabs.developers.google.com/adk-eval/instructions),
conferidos com o código e os payloads da versão 1.39.1 instalada.

Melhoria opcional: corrigir a formatação preexistente do cliente Databricks em
alteração separada.
