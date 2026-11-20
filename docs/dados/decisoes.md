# Decisões de engenharia de dados

Registro das decisões tomadas na frente de dados do projeto Lojas Horizonte: o que foi decidido, por quê e quais alternativas foram descartadas.

**Responsável:** Diego Alessandro (Engenharia de Dados)
**Como usar:** cada decisão tem um número (`D01`, `D02`...). Uma decisão nunca é apagada; se mudar, a original recebe o status *Substituída* e uma nova decisão é registrada.

| Status | Significado |
|---|---|
| Aceita | Em uso no pipeline |
| Proposta | Implementada ou planejada, aguardando validação do squad |
| Substituída | Trocada por outra decisão (indicada no texto) |

---

## Resumo

| ID | Decisão | Status |
|---|---|---|
| D01 | Databricks Free Edition como ambiente do MVP | Aceita |
| D02 | Arquitetura desenhada no GCP; MVP executado no Databricks | Aceita |
| D03 | Olist como fonte do canal marketplace, com o mix real (opção A) | Proposta |
| D04 | De-para de categorias: 15 das 73 categorias no mix da Horizonte | Aceita |
| D05 | Bronze guarda tudo como texto, com colunas de auditoria | Aceita |
| D06 | Bronze em SQL (`read_files`) em vez de PySpark | Aceita |
| D07 | Silver marca as linhas em vez de removê-las | Aceita |
| D08 | Regra de pedido válido | Aceita |
| D09 | Janela útil do Olist: jan/2017 a ago/2018 | Aceita |
| D10 | Deslocamento de datas de 418 semanas | Aceita |
| D11 | Cliente identificado por `customer_unique_id` | Aceita |
| D12 | Unificação dos canais por categoria, sem SKU único | Aceita |
| D13 | Catálogo sintético de 200 SKUs, com preços calibrados pelo Olist | Proposta |
| D14 | Sazonalidade como índice relativo, não contagem bruta | Aceita |
| D15 | Padrão de dia da semana próprio para as lojas físicas | Proposta |
| D16 | Grupo Casa vendido só nos canais online | Proposta |
| D17 | Premissas do gerador do ERP (lojas, volume, estoque e sujeira plantada) | Proposta |
| D18 | Regras de qualidade da silver do ERP | Aceita |
| D19 | Recomendação de produtos como recurso de IA | Aceita |
| D20 | Unificação dos canais na silver (fato e dimensões) | Aceita |
| D21 | Recomendação conversacional no agente ADK | Aceita |
| D22 | Consumidores leem a gold no workspace do pipeline, só com leitura | Aceita |
| D23 | Premissas do gerador do histórico do site | Proposta |
| D24 | Contrato da camada gold | Proposta |

---

## D01 · Databricks Free Edition como ambiente do MVP

- **Data:** 2026-11-13
- **Status:** Aceita
- **Contexto:** o desafio cita o Databricks Community Edition, que foi aposentado em 01/01/2026.
- **Decisão:** usar o Databricks Free Edition, seu substituto oficial (serverless, Unity Catalog, dashboards AI/BI).
- **Impacto:** compute apenas serverless; acesso restrito à internet a partir do workspace; limite de 500 tabelas e de 5 tarefas de job simultâneas. Arquivos ficam em Volumes do Unity Catalog, não no DBFS.

## D02 · Arquitetura desenhada no GCP; MVP executado no Databricks

- **Data:** 2026-11-12
- **Status:** Aceita
- **Contexto:** a regra do desafio pede a arquitetura ideal no GCP e a execução prática no Databricks ou localmente.
- **Decisão:** o MVP espelha o desenho do GCP, com nomes equivalentes:

  | GCP | Databricks (MVP) |
  |---|---|
  | Projeto `lojas-horizonte` | Catálogo `horizonte` |
  | Datasets `bronze`, `silver`, `gold` | Schemas `bronze`, `silver`, `gold` |
  | Bucket de landing no Cloud Storage | Volume `bronze.landing` |
  | Transformações no Dataform | Notebooks SQL |

- **Impacto:** as transformações são escritas em SQL, com versão BigQuery equivalente em `sql/bigquery/`.

## D03 · Olist como fonte do canal marketplace, com o mix real (opção A)

- **Data:** 2026-11-14
- **Status:** Proposta (validar com Emanuel e Henry)
- **Contexto:** o Olist quase não tem roupas: 611 itens de roupa e calçado em 112.650 (0,5%). Não há volume para prever demanda por categoria de roupa.
- **Decisão:** usar o Olist como ele é, mantendo só as categorias plausíveis para uma rede de moda. No marketplace, a Horizonte vende principalmente acessórios, beleza, casa e esporte; roupas aparecem nos canais site e lojas físicas (dados sintéticos).
- **Alternativa descartada:** reatribuir produtos fora do mix (eletrônicos, móveis) a categorias de roupa. Manteria 100% do volume, mas criaria uma relação falsa entre produto e categoria e enfraqueceria o argumento de dados reais.
- **Impacto:** a previsão de demanda passa a ser **por grupo** (Vestuário, Acessórios, Beleza, Casa, Esporte), de preferência treinada só com o marketplace real.

## D04 · De-para de categorias

- **Data:** 2026-11-13
- **Status:** Aceita
- **Decisão:** tabela de correspondência mantida à mão em `data/referencia/de_para_categorias.csv`, com uma justificativa por categoria. Critério: a categoria entra se uma rede de moda brasileira vende esse tipo de produto.
- **Resultado:** 15 das 73 categorias entram no mix, somando 43.034 itens (38% do Olist).
- **Alternativas avaliadas e não incluídas:** `moveis_decoracao`, `utilidades_domesticas` e `bebes` têm volume relevante, mas enfraqueceriam a narrativa de loja de moda.

## D05 · Bronze guarda tudo como texto, com colunas de auditoria

- **Data:** 2026-11-13
- **Status:** Aceita
- **Decisão:** os CSVs são lidos sem inferência de tipos, e cada linha recebe `_arquivo_origem` e `_ingerido_em`.
- **Motivo:** a bronze é uma cópia fiel da fonte. Problemas de formato não quebram a carga e são tratados na silver. As colunas de auditoria são a base da linhagem.

## D06 · Bronze em SQL em vez de PySpark

- **Data:** 2026-11-14
- **Status:** Aceita (substitui a primeira versão em PySpark)
- **Decisão:** ingestão com `read_files` em SQL.
- **Motivo:** a consulta fica estruturalmente igual à versão BigQuery (tabela externa + `CREATE TABLE AS SELECT`), o que torna o paralelo GCP × MVP evidente. O pipeline inteiro fica numa linguagem só.

## D07 · Silver marca as linhas em vez de removê-las

- **Data:** 2026-11-14
- **Status:** Aceita
- **Decisão:** a silver não apaga nenhuma linha. Cada item recebe três marcações: `valido` (venda real), `incluir` (produto do mix) e `periodo_completo` (data confiável). O filtro acontece só na gold.
- **Motivo:** rastreabilidade (dá para medir o efeito de cada regra) e flexibilidade (mudar uma regra não exige recarregar dados).

## D08 · Regra de pedido válido

- **Data:** 2026-11-13
- **Status:** Aceita
- **Decisão:** pedido válido = status diferente de `canceled` e `unavailable` **e** com pelo menos um item.
- **Motivo:** os demais status (`shipped`, `invoiced`, `processing`...) são vendas em andamento, contadas na data da compra. Existem 775 pedidos sem itens; 8 deles não são cancelados nem indisponíveis e também são excluídos. Atenção: 461 pedidos cancelados têm itens, por isso a exclusão é feita pelo status, não apenas pelo join.
- **Resultado:** 98.199 pedidos válidos de 99.441.

## D09 · Janela útil do Olist

- **Data:** 2026-11-13
- **Status:** Aceita
- **Decisão:** só entram na gold compras de 01/01/2017 a 31/08/2018 (datas originais).
- **Motivo:** set–dez/2016 e set–out/2018 somam só 349 pedidos, e nov/2016 não tem nenhum. Esses meses seriam lidos pelo modelo como quedas de venda.

## D10 · Deslocamento de datas de 418 semanas

- **Data:** 2026-11-13
- **Status:** Aceita
- **Decisão:** somar 2.926 dias (418 semanas) às datas do Olist.
- **Motivo:** alinha a Black Friday de 24/11/2017 com a de 28/11/2025 e mantém o dia da semana. O histórico do marketplace passa a ir de 05/01/2025 a 04/09/2026, e a próxima Black Friday (27/11/2026) fica no futuro, o que permite demonstrar a previsão.
- **Impacto:** o marketplace não tem dados entre setembro de 2026 e hoje. O dashboard deve indicar a data de corte.

## D11 · Cliente identificado por `customer_unique_id`

- **Data:** 2026-11-13
- **Status:** Aceita
- **Motivo:** no Olist, `customer_id` é gerado por pedido (a tabela de clientes tem exatamente uma linha por pedido). O cliente real é o `customer_unique_id`.

## D12 · Unificação dos canais por categoria, sem SKU único

- **Data:** 2026-11-14
- **Status:** Aceita
- **Contexto:** ERP e site usam o catálogo da Horizonte; o Olist tem códigos de produto próprios, sem nome e sem o SKU do vendedor.
- **Decisão:** os três canais se juntam pela categoria, grupo, canal e data. A coluna de produto guarda o código de origem de cada canal, para rastreabilidade.
- **Alternativa descartada:** atribuir um SKU do catálogo a cada produto do Olist. Criaria uma relação inventada e um conflito entre o preço real do Olist e o preço do catálogo.
- **Limitação assumida:** não há ranking de produtos somando os três canais; o ranking é por canal.
- **Em produção:** o ERP seria o cadastro mestre de produtos, e os pedidos do marketplace chegariam com o SKU do vendedor.

## D13 · Catálogo sintético calibrado pelo Olist

- **Data:** 2026-11-14
- **Status:** Proposta (validar colunas com o Caio)
- **Decisão:** catálogo de 200 SKUs de moda (`data/referencia/catalogo.csv`), gerado por `data/geradores/gera_catalogo.py`, compartilhado pelos geradores do ERP e do site e pela API.
- **Regra de preço:** preço-base do tipo de produto × fator do material, posicionado na faixa de preço do Olist para a categoria (notebook `04_calibracao_catalogo`). A cor não muda o preço.
- **Custo:** preço × (1 − margem). As margens são premissas do squad, em `data/geradores/parametros.yaml`, porque o Olist não tem custo.
- **Limitação:** as faixas de Feminino (47 itens no Olist) e Infantil (8 itens) têm referência fraca.

## D14 · Sazonalidade como índice relativo

- **Data:** 2026-11-15
- **Status:** Aceita
- **Contexto:** o volume do Olist cresceu cerca de 13 vezes no período (crescimento da plataforma, não sazonalidade).
- **Decisão:** cada dia é dividido pela tendência local (mediana móvel de 29 dias), gerando um índice: 1,0 é um dia normal; a Black Friday tem índice 5,9. Script: `data/geradores/prepara_sazonalidade.py`.
- **Ajustes:** dias após 25/08/2026 descartados (corte de extração do dataset); queda entre 25/05 e 05/06/2026 marcada como possível efeito da greve dos caminhoneiros de maio de 2018 (datas originais).
- **Impacto:** os geradores usam o formato da curva sem herdar o crescimento do Olist. Para datas além de 25/08/2026, usam o índice do mesmo dia da semana 52 semanas antes.

## D15 · Padrão de dia da semana próprio para as lojas físicas

- **Data:** 2026-11-15
- **Status:** Proposta
- **Contexto:** no online (Olist), o sábado é o dia mais fraco (índice 0,75). Em loja física, é o mais forte.
- **Decisão:** o gerador do ERP remove o efeito de dia da semana do Olist e aplica um padrão próprio, definido em `parametros.yaml`:

  | seg | ter | qua | qui | sex | sáb | dom |
  |---|---|---|---|---|---|---|
  | 0,80 | 0,85 | 0,90 | 0,95 | 1,15 | 1,45 | 0,90 |

  O site mantém o padrão do Olist, por ser canal online.

## D16 · Grupo Casa vendido só nos canais online

- **Data:** 2026-11-15
- **Status:** Proposta (validar com o squad; afeta o site do Caio e o dashboard do Henry)
- **Contexto:** o catálogo tem 8 SKUs de Casa (almofada, toalha, manta, cortina, jogo de cama). No marketplace, Casa tem volume real relevante (11.553 itens no Olist), mas são produtos volumosos e fora do núcleo de moda, que disputariam espaço de loja com o vestuário.
- **Decisão:** as lojas físicas não vendem o grupo Casa. Ele aparece só no site e no marketplace, como extensão de sortimento do online. Parâmetro em `parametros.yaml`: `grupos_fora_da_loja_fisica: [Casa]` (com `[]`, as lojas passam a vender tudo).
- **Alternativa descartada:** vender o catálogo inteiro em todas as lojas. Seria mais simples, mas não mostraria a diferença de sortimento entre canais, comum no varejo multicanal.
- **Impacto:**
  - O sortimento das lojas físicas parte de 192 SKUs (200 menos os 8 de Casa).
  - No dashboard, Casa tem receita zero nas lojas físicas por desenho, não por falha de dados.
  - O giro de estoque de Casa só existe no site.
  - A previsão de demanda de Casa usa apenas histórico online.

## D17 · Premissas do gerador do ERP

- **Data:** 2026-11-15
- **Status:** Proposta (validar com o squad)
- **Contexto:** não existe ERP real. O canal loja física precisa de dados plausíveis, reproduzíveis e com problemas conhecidos para as checagens de qualidade. Script: `data/geradores/gera_erp.py`. Todos os números estão na seção `erp` do `parametros.yaml`.
- **Lojas:** 12 no Sudeste (7 em SP, 2 no RJ, 3 em MG). O porte define o volume e o sortimento:

  | Porte | Lojas | Itens num dia normal | Sortimento | SKUs |
  |---|---|---|---|---|
  | G | L01 Paulista, L08 Rio Centro, L10 Belo Horizonte | 80 | 100% | 192 |
  | M | L02, L03, L04, L05, L11 | 50 | 85% | 163 |
  | P | L06, L07, L09, L12 | 30 | 70% | 134 |

  Os SKUs mais populares têm mais chance de entrar no sortimento das lojas menores.
- **Período:** 01/02/2025 a 15/11/2026 (653 dias). Janeiro de 2025 fica de fora porque o índice de sazonalidade é instável no início do Olist. A data final é fixa para o resultado ser reproduzível. Datas após 25/08/2026 usam o índice do mesmo dia 52 semanas antes (D14).
- **Volume diário:** itens do porte × índice de sazonalidade sem o efeito de dia da semana do online × fator de dia da semana da loja física (D15). O índice é limitado entre 0,4 e 8,0 para evitar dias extremos.
- **Escolha dos produtos:** popularidade do SKU (lognormal do catálogo) × peso do grupo (Vestuário 1,0; Acessórios 0,8; Beleza 0,7; Esporte 0,6).
- **Cupom fiscal:** média de 1,8 item por cupom. Horário entre 10h e 22h, com pico às 17h.
- **Preço:** preço de tabela do catálogo. Black Friday 2025: 25% de desconto de 28/11 a 01/12. O desconto muda só o preço; o aumento de volume vem do índice de sazonalidade.
- **Estoque:** simulado dia a dia, por loja e SKU, com base na demanda média do SKU na loja:
  - estoque máximo de 30 dias de venda;
  - novo pedido quando o estoque cai a 10 dias de venda;
  - reposição chega 5 dias depois do pedido.

  A loja só vende o que tem: a demanda sem estoque é perdida (não vira pedido pendente). A política não antecipa picos, e esse é o problema que a previsão de demanda resolve.
- **Sujeira plantada** nas vendas, para as checagens de qualidade encontrarem:

  | Problema | Taxa | Linhas no arquivo |
  |---|---|---|
  | Linha duplicada (cópia exata) | 0,2% | 801 |
  | SKU nulo | 0,1% | 400 |
  | Quantidade negativa (e valor negativo) | 0,1% | 401 |

  Uma linha pode ter mais de um problema: uma das duplicadas é cópia de uma linha com quantidade negativa, por isso são 401 negativas para 400 plantadas.
- **Resultado** (seed 42; arquivos idênticos a cada execução, conferido por checksum):
  - `erp_vendas.csv.gz`: 401.335 linhas e 225.410 cupons.
  - Receita sem a sujeira: R$ 30,8 mi. Ticket médio: R$ 136,78.
  - Mediana de 585 itens por dia; 4.200 na Black Friday (28/11/2025).
  - `erp_estoque_diario.csv.gz`: 1.258.331 linhas (loja × SKU × dia).
  - Ruptura (combinações loja × SKU com estoque final zero): mediana de 1,3% ao dia, subindo para 23,4% em 01/12/2025 e voltando a 2% só em 04/12.
- **Limitações assumidas:**
  - Todas as lojas seguem a mesma curva de sazonalidade (sem eventos locais).
  - Não há devoluções, trocas nem transferência de estoque entre lojas.
  - O custo é fixo, vindo do catálogo.
  - A única promoção é a Black Friday.

## D18 · Regras de qualidade da silver do ERP

- **Data:** 2026-11-16
- **Status:** Aceita
- **Decisão:** cada problema das vendas do ERP tem uma marcação própria (`sku_nulo`, `sku_sem_cadastro`, `quantidade_negativa`, `duplicada`), e `valido` é verdadeiro quando não há nenhum. Nada é removido (D07).
- **Duplicadas:** a primeira ocorrência de um grupo de linhas idênticas vale; as demais são marcadas (`ROW_NUMBER()` sobre todas as colunas). Como as cópias são idênticas, a escolha não altera o resultado.
- **Quantidade negativa:** tratada como erro, não como devolução, porque o ERP não registra devoluções (D17). Em produção, devolução seria outro tipo de documento.
- **Custo:** `custo_total = quantidade × custo` do `erp_produtos`, porque o ERP é o cadastro mestre de produtos (D12).
- **Resultado:** 401.335 linhas; 400 SKU nulo, 0 SKU sem cadastro, 401 quantidade negativa, 801 duplicadas; 399.736 válidas (3 linhas têm dois problemas). Receita válida de R$ 30.795.090,78 e ticket médio de R$ 136,78, iguais ao resumo do gerador.

## D19 · Recomendação de produtos como recurso de IA

- **Data:** 2026-11-17
- **Status:** Aceita (decisão do squad)
- **Contexto:** o enunciado pede um recurso de IA, recomendação de produtos **ou** previsão de demanda. A primeira escolha foi a previsão.
- **Decisão:** o recurso de IA passa a ser a **recomendação de produtos**. A previsão de demanda fica em aberto (opcional, se sobrar tempo).
- **Motivo:** responde à dor 4 do cliente ("nenhuma personalização ou recomendação de produtos"), que a previsão deixava sem resposta.
- **Impacto nos dados:**
  - O Olist e o ERP não sustentam a recomendação (clientes que compram uma vez; itens de cupom sorteados de forma independente). O histórico vem do **gerador do site**, com clientes recorrentes e afinidades entre produtos definidas no `parametros.yaml`. O modelo encontra padrões que o gerador plantou, e isso é dito na apresentação.
  - Avaliações sintéticas, ligadas a pedidos do site, num arquivo próprio.
  - As recomendações calculadas no Databricks voltam para a API como uma tabela pronta (`sku → skus recomendados`).
- **Substitui:** a escolha da previsão como recurso principal (seção 1.3 do CONTEXTO). A D03 continua válida para o marketplace.
- **Responsável:** Emanuel

## D20 · Unificação dos canais na silver (fato e dimensões)

- **Data:** 2026-11-17
- **Status:** Aceita
- **Decisão:** a silver unificada segue o modelo estrela. A `fato_vendas` empilha (`UNION ALL`) as vendas de cada canal, uma linha por item, com as colunas `canal, data, data_hora, pedido_id, loja_id, cliente_id, produto_id, categoria, grupo, quantidade, receita, custo, custo_estimado, valido`. Dimensões: `dim_categoria`, `dim_canal`, `dim_loja`, `dim_data`. Notebook `10_silver_unificada`; os números 08 e 09 ficam reservados para o site, para a numeração seguir a ordem de execução.
- **Regras:**
  - `valido` resume as regras de cada canal (ERP: D18; marketplace: `valido AND incluir AND periodo_completo`). Nada é removido (D07).
  - Receita do marketplace sem frete: frete não é venda de produto.
  - Custo do marketplace estimado pela margem da categoria (`custo_estimado = true`). A margem é calculada do próprio catálogo (`1 − custo ÷ preço`) e é idêntica à do `parametros.yaml` (conferido): nenhum número novo no código.
  - `cliente_id`: nulo no ERP (cupom sem identificação), `customer_unique_id` no marketplace (D11). Permite contar clientes únicos e recompra; no site, recebe o `usuario_hash` do contrato do Caio.
  - `dim_data` vai do primeiro dia com venda válida até 31/12 do ano da última venda, para incluir a Black Friday de 2026. Black Friday por regra (sexta-feira de novembro entre os dias 23 e 29), sem data fixa no código.
- **Resultado:** loja física com 401.335 linhas, 399.736 válidas, 403.365 unidades e R$ 30.795.090,78; marketplace com 112.650 linhas, 42.758 válidas (= unidades) e R$ 5.250.663,26. Nenhuma venda válida sem grupo. Calendário de 09/01/2025 (primeira venda válida) a 31/12/2026: 722 dias, Black Fridays em 28/11/2025 e 27/11/2026.
- **Pendente:** o site entra como mais um bloco do `UNION ALL`, sem mudar as colunas.

## D21 · Recomendação conversacional no agente ADK

- **Data:** 2026-11-18
- **Status:** Aceita
- **Contexto:** a D19 previa um modelo treinado no histórico de compras, com uma tabela de recomendações voltando para a API. O Emanuel definiu outra abordagem.
- **Decisão:** o agente ADK responde dúvidas sobre os produtos e recomenda a partir do que a pessoa descreve (RAG sobre o catálogo e as avaliações). A recomendação acontece na conversa, não na vitrine.
- **Substitui:** o trecho "Impacto nos dados" da D19, que continua válida quanto à escolha da recomendação como recurso de IA.
- **Impacto nos dados:**
  - Catálogo v2 (`gera_catalogo.py`, PR #44): novas colunas `tipo`, `variacao`, `cor`, `descricao`, `ocasioes` e `imagem_url`, montadas por regra a partir do `parametros.yaml`, sem sorteio novo. SKUs, preços, custos e popularidade idênticos aos da v1; nomes com concordância corrigida (73 de 200). Vendas e estoque do ERP idênticos (conteúdo conferido por checksum).
  - O agente vai ler a `gold.gold_catalogo` (catálogo sem custo e popularidade, com nota média e unidades vendidas) e a `gold.gold_avaliacoes` (nota e texto). Enquanto o agente não acessa o workspace do pipeline, a entrega é por CSV.
  - O gerador do site produz avaliações com texto coerente com a nota e o tipo de produto. Não precisa de clientes recorrentes nem de afinidades entre produtos.
  - Não há tabela de recomendações voltando para a API.
  - Unidades vendidas consideram loja física e site; o marketplace não tem SKU do catálogo (D12).
- **Responsável:** Emanuel (agente); Diego (catálogo e tabelas gold).

## D22 · Consumidores leem a gold no workspace do pipeline, só com leitura

- **Data:** 2026-11-18
- **Status:** Aceita
- **Contexto:** o Henry (dashboard) e o Emanuel (agente) precisam dos dados da gold. Entregar CSVs por mensagem exigiria reenviar a cada atualização do pipeline.
- **Decisão:** os dois foram adicionados ao workspace do Databricks com o mínimo necessário (menor privilégio):
  - permissões da ferramenta: *Consumer access* e *Databricks SQL access*; sem *Workspace access* (notebooks e compute) e sem *Admin access*;
  - uso do SQL warehouse (*Can use*);
  - dados: `USE CATALOG` em `horizonte` e `USE SCHEMA, SELECT` em `horizonte.gold`. Sem acesso à bronze e à silver, e sem permissão de escrita.
- **Equivalente no GCP:** papel `roles/bigquery.dataViewer` no dataset `gold` e `roles/bigquery.jobUser` no projeto, para executar consultas.
- **Limitações:** no Free Edition, usuários adicionados não podem ser removidos da conta; as consultas deles usam a cota de compute do workspace do pipeline.
- **Responsável:** Diego.

## D23 · Premissas do gerador do histórico do site

- **Data:** 2026-11-19
- **Status:** Proposta (validar com o squad)
- **Contexto:** o contrato com a API (`SCHEMA_PIPELINE_v1`, do Caio) define que o histórico do site é gerado pela Engenharia de Dados, nos mesmos 3 arquivos da exportação ao vivo (`pedidos`, `pedido_itens`, `eventos`), até o corte de 2026-11-18T00:00:00Z. Script: `data/geradores/gera_site.py`; números na seção `site` do `parametros.yaml`.
- **Decisões:**
  - Volume: 1.000 sessões num dia normal, com a sazonalidade do Olist **com** o efeito de dia da semana do online (D15). Período igual ao do ERP (desde 01/02/2025).
  - Funil: 60% das sessões veem produto; 16,67% destas põem no carrinho; 45% dos carrinhos iniciam o checkout; 66,7% dos checkouts compram. Resultado: conversão de ~3% e abandono de carrinho de ~70%, dentro das faixas do contrato.
  - Clientes: base de 30.000 `usuario_hash` (sha256, 16 caracteres) com recorrência desigual (lognormal); 50% das sessões anônimas, mas quem chega ao checkout se identifica.
  - Pedidos: frete grátis acima de R$ 199, senão R$ 19,90; 5% cancelados entre 2 e 72 horas depois da compra (só antes do corte); Black Friday 2025 com 25% de desconto, como no ERP; Casa vendida no site (D16).
  - Sem sujeira plantada: o contrato exige consistência (toda sessão começa com `session_start`; todo pedido tem exatamente um `purchase` com o mesmo valor; `purchase` depois de `add_to_cart` e `begin_checkout`; SKUs do catálogo). O gerador verifica as quatro regras antes de salvar.
- **Resultado** (seed 42; conteúdo idêntico a cada execução): 669.148 sessões, 1.816.833 eventos, 20.180 pedidos e 28.407 itens; conversão de 3,02%, abandono de 69,8%, cancelamento de 5,1%; receita dos pedidos finalizados sem frete de R$ 2.390.036,02; ticket médio de R$ 124,84 sem frete e R$ 141,26 com frete; 188 pedidos na Black Friday contra a mediana de 30 por dia.
- **Limitações:** sem histórico de estoque do site (o giro de estoque fica só com a loja física por enquanto); avaliações vêm da fonte do Emanuel e do Henry, não deste gerador.

## D24 · Contrato da camada gold

- **Data:** 2026-11-19
- **Status:** Proposta (validar com Henry e Emanuel)
- **Decisão:** a gold tem uma tabela por assunto, sempre com a coluna `canal`, e só vendas válidas: `gold_vendas_diarias`, `gold_pedidos_diarios`, `gold_estoque_diario`, `gold_funil_diario`, `gold_catalogo` e, quando houver a fonte, `gold_avaliacoes`; e as dimensões `dim_data` e `dim_loja`, publicadas como views sobre a silver, para os consumidores continuarem lendo só a gold (D22). Colunas, fórmulas e consultas dos indicadores em `docs/dados/dicionario_gold.md`.
- **Receita e ticket médio sem frete em todos os canais:** o ERP não tem frete e o marketplace foi tratado sem frete (D20); o contrato com a API calcula o ticket com frete, mas isso deixaria os canais incomparáveis. O frete do site continua disponível na silver.
- **Ticket e taxas de um período** são calculados somando numerador e denominador, nunca pela média dos valores diários.
- **Limitações:** estoque só da loja física (D23); margem do marketplace estimada (D20).
