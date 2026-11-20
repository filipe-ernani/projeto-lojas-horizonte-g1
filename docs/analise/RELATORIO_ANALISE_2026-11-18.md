# Relatório de análise: Lojas Horizonte

**Data:** 2026-11-18 · **Branch:** dev · **Commit:** 4275e27 · **Backlog:** [backlog_correcoes.md](backlog_correcoes.md)

## 1. Resumo executivo

1. Foram consolidados **116 achados**: 7 críticos, 21 altos, 57 médios e 31 baixos.
2. O projeto não está pronto para entrega: há um bypass de autenticação, uma chave publicada e fluxos centrais quebrados (favoritos, perfil, endereços, cancelamento e quantidade na cesta).
3. Os problemas conhecidos 2 a 6 foram confirmados com causa raiz. No problema 1, a hipótese de CORS foi refutada.
4. Lint e build passam, mas não detectam esses defeitos, e o projeto não tem testes automatizados.
5. Nenhuma tela foi renderizada: tudo que depende de navegador ou login está marcado como NÃO VERIFICADO.

## 2. Mapa de saúde por bloco

| Bloco | Situação | Crít. | Alto | Médio | Baixo | Leitura |
|---|---|---:|---:|---:|---:|---|
| Backend público | **ATENÇÃO** | 0 | 0 | 6 | 6 | Contrato principal e SQL parametrizado corretos; faltam validações de entrada. |
| Backend privado | **CRÍTICO** | 0 | 3 | 10 | 4 | Isolamento por usuário correto, mas o bypass de autenticação compromete o bloco. |
| Banco e contratos | **CRÍTICO PARA ENTREGA** | 0 | 5 | 7 | 4 | Sem contrato no repositório, sem migrações e com risco de perda na exportação. |
| Front dados | **CRÍTICO** | 1 | 7 | 6 | 7 | Cesta com perda de dados, quantidade errada e estados de erro e carga incorretos. |
| Front UI | **CRÍTICO** | 4 | 4 | 19 | 5 | Favoritos, perfil, endereços e cancelamento quebrados. Renderização não verificada. |
| Segurança e integração | **CRÍTICO** | 2 | 2 | 9 | 4 | Bypass, chave publicada e deploy no Render ainda não preparado. |
| QA | **INSUFICIENTE** | 0 | 0 | 0 | 1 | Lint e build passam, mas não há testes automatizados nem fluxo de tela executado. |

## 3. Problemas conhecidos

| # | Problema | Resultado | Causa raiz e evidência |
|---|---|---|---|
| 1 | Dois Vite (5173 e 5174) | **PARCIAL** | A segunda porta é explicada pela falta de `strictPort` (H-030). A hipótese de CORS foi **refutada**: `backend/src/app.js:27` aceita qualquer origem (H-029). Domínio autorizado do Firebase: NÃO VERIFICADO. Duas instâncias simultâneas não foram reproduzidas; só havia `[::1]:5173` em escuta. |
| 2 | Silhuetas sem cor na cesta | **CONFIRMADO** | A API não envia o hex, o mapeador não o preserva e `CartItem.jsx:55` não passa `cor` (H-014, H-015). Pedidos têm o mesmo defeito. |
| 3 | `salvarPerfilApi is not a function` | **CONFIRMADO** | `Perfil.jsx:36` pede `salvarPerfil`; `usePerfil.js:84` expõe `salvar` (H-004). Corrigir só o nome expõe H-010. |
| 4 | `criarEndereco is not a function` | **CONFIRMADO, MAIOR** | `Perfil.jsx:44-46` usa nomes que `useEnderecos.js:100-102` não expõe. Editar e excluir também quebram (H-005). |
| 5 | Tela branca em /favoritos | **CONFIRMADO** | `Favoritos.jsx:28` lê `itens`, ausente em `useFavoritos.js:10-20`; a linha 156 quebra (H-003). |
| 6 | Checkout com boleto | **CONFIRMADO** | A regra está na tela, na API, no banco e nos docs. Não há débito nem parcelas (H-022, H-023, H-024). |
| 7 | Teste de tela anterior não confiável | **MANTIDO** | `docs/STATUS.md:73,125` afirma testes e a linha 68 segue pendente. Nenhuma tela foi renderizada nesta análise, portanto nada de responsividade foi comprovado (H-085). |

## 4. Achados por gravidade

A coluna **Verificação** indica o que o orquestrador abriu no código: 61 de 116 achados, incluindo todos os críticos e altos. "Analista" significa que o achado não entrou na amostra e mantém a evidência do analista de origem.

### CRÍTICO (7)

| ID | Bloco | Arquivo:linha | Problema | Evidência | Origem | Verificação |
|---|---|---|---|---|---|---|
| H-001 | Segurança e integração | `backend/src/middlewares/auth.js:21-30` | **DECISÃO D3.** Tokens `test:` e `mock:` autenticam qualquer uid sem verificação quando `NODE_ENV` difere de `production`. | Condição em auth.js:22. `NODE_ENV` só aparece nessa linha (busca em backend/src, package.json, docker-compose e .env.example). Bypass não exercitado. | BP-001, BV-001, BD-003, FD-017, QA-009, SG-002 | Confirmado pelo orquestrador |
| H-002 | Segurança e integração | `backend/scripts/test-b3b.js:134` | **DECISÃO D2.** Valor literal de X-API-Key em script versionado e publicado em `origin/dev` (valor omitido neste relatório). | Linha sem `process.env`; `git branch -r --contains 3de3cf1` retorna `origin/dev`. Se é a chave em uso: NÃO VERIFICADO. | BV-002, BD-007, SG-001 | Confirmado pelo orquestrador |
| H-003 | Front UI | `frontend/src/pages/Favoritos/Favoritos.jsx:28,39,156` | Problema conhecido 5: /favoritos fica em tela branca. | A página lê `itens`, mas `useFavoritos.js:10-20` devolve `dados` e `favoritos`. A linha 156 lê `produtos.length` de `undefined`. | FD-001, FU-001, QA-001, BV-007 | Confirmado pelo orquestrador |
| H-004 | Front UI | `frontend/src/pages/Perfil/Perfil.jsx:36,82` | Problema conhecido 3: salvar perfil falha com "salvarPerfilApi is not a function". | A página pede `salvarPerfil`; `usePerfil.js:84` expõe `salvar`. | FD-002, FU-002, QA-002, BV-008 | Confirmado pelo orquestrador |
| H-005 | Front UI | `frontend/src/pages/Perfil/Perfil.jsx:44-46,90,92,99` | Problema conhecido 4, maior que o relatado: criar, editar e excluir endereço falham. Sem endereço, a compra não finaliza. | `useEnderecos.js:100-102` expõe `criar`, `editar` e `excluir`. | FD-003, FU-003, QA-003, BV-009 | Confirmado pelo orquestrador |
| H-006 | Front UI | `frontend/src/pages/Pedidos/Pedidos.jsx:26-27,46`<br>`frontend/src/hooks/usePedidos.js:61-68` | Cancelar pedido gera TypeError: a página pede `cancelarPedido` e `cancelando`, que o hook não devolve. | `usePedidos.js:67` expõe apenas `cancelar`; `cancelando` não existe. | FD-004, FU-004, QA-006 | Confirmado pelo orquestrador |
| H-007 | Front dados | `frontend/src/pages/Carrinho/Carrinho.jsx:88-93`<br>`frontend/src/context/CarrinhoContextProvider.jsx:177` | Os botões + e − da cesta sempre gravam quantidade 1. | A página passa 4 argumentos e o provider aceita 2. A quantidade vira `NaN` (linha 198) e `carrinhoService.js:24` envia 1. | FD-005, FU-005, QA-004 | Confirmado pelo orquestrador |

### ALTO (21)

| ID | Bloco | Arquivo:linha | Problema | Evidência | Origem | Verificação |
|---|---|---|---|---|---|---|
| H-008 | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:186-200,216-221`<br>`frontend/src/components/CartItem/CartItem.jsx:37,43` | Alterar ou remover um item afeta todas as variantes do mesmo SKU. | A comparação usa só o SKU e `CartItem` envia só `produtoId`. | FD-007, FU-009, QA-005, BV-020 | Confirmado pelo orquestrador |
| H-009 | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:81,86,97` | Perda de dados: adicionar antes do GET terminar, ou depois de ele falhar, parte de `itens=[]` e o PUT substitui a cesta no servidor. | Não há guarda em 76-78; `carrinhoQueries.js:104` apaga os itens e regrava. | FD-006 | Confirmado pelo orquestrador |
| H-010 | Front dados | `frontend/src/hooks/usePerfil.js:60,68`<br>`frontend/src/pages/Perfil/Perfil.jsx:110,114` | Salvar perfil troca o formulário pelo skeleton; em falha, mostra "Não foi possível carregar seu perfil" e perde o que foi digitado. | `salvar` usa os mesmos `carregando` e `erro` da carga. | FD-011, FU-006 | Confirmado pelo orquestrador |
| H-011 | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:34`<br>`frontend/src/context/FavoritosContextProvider.jsx:20`<br>`frontend/src/hooks/useEnderecos.js:19`<br>`frontend/src/hooks/usePedidos.js:13`<br>`frontend/src/hooks/usePerfil.js:21` | `carregando` nunca liga na carga: a tela mostra "cesta vazia" ou "sem pedidos" enquanto os dados chegam. | Nesses arquivos, `setCarregando(true)` só existe em `usePerfil.js:60`, dentro de `salvar`. | FD-008, FU-010, QA-011 | Confirmado pelo orquestrador |
| H-012 | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:38-40`<br>`frontend/src/context/FavoritosContextProvider.jsx:24-26`<br>`frontend/src/hooks/useEnderecos.js:23-25`<br>`frontend/src/hooks/usePedidos.js:17-19`<br>`frontend/src/hooks/usePerfil.js:25-27` | "Tentar de novo" não sai da tela de erro, mesmo quando a nova busca dá certo. | Nesses arquivos, `setErro(null)` só existe em `usePerfil.js:61`, dentro de `salvar`. | FD-009, FU-011, QA-007 | Confirmado pelo orquestrador |
| H-013 | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:115`<br>`frontend/src/context/FavoritosContextProvider.jsx:118` | Falha ao alterar item grava no mesmo `erro` da carga e derruba a página inteira da cesta, do checkout ou dos favoritos. | `Carrinho.jsx:67`, `Checkout.jsx:104` e `Favoritos.jsx:58` trocam a tela ao haver `erro`. | FD-010, FU-011 | Confirmado pelo orquestrador |
| H-014 | Backend privado | `backend/src/queries/carrinhoHelpers.js:22`<br>`backend/src/queries/carrinhoQueries.js:19,159`<br>`backend/src/queries/pedidosQueries.js:45,90,165` | **DECISÃO D5.** Problema conhecido 2, parte da API: carrinho e pedidos devolvem só o nome da cor. | As queries não selecionam `p.cores`; o hex existe em `loja.produtos.cores`. | BP-002, BV-010, BD-017, FD-012, FU-012, QA-010, SG-015 | Confirmado pelo orquestrador |
| H-015 | Front UI | `frontend/src/services/mapeadores.js:127`<br>`frontend/src/components/CartItem/CartItem.jsx:55`<br>`frontend/src/components/OrderCard/OrderCard.jsx:102,122` | Problema conhecido 2, parte do front: o mapeador descarta o hex e os componentes não passam `cor`. | `ProductImage.jsx:110` só pinta com hex; sem ele a silhueta usa o neutro. | FD-012, FU-012, QA-010, BV-010 | Confirmado pelo orquestrador |
| H-016 | Front UI | `frontend/src/main.jsx:14-26`<br>`frontend/src/App.jsx:18-52` | Sem ErrorBoundary, qualquer erro de renderização vira tela branca. | Busca por `ErrorBoundary` e `componentDidCatch` em `frontend/src`: 0 ocorrências. | FD-013, FU-017 | Confirmado pelo orquestrador |
| H-017 | Front UI | `frontend/src/components/Layout/Layout.jsx:30`<br>`frontend/src/components/ChatWidget/ChatWidget.jsx:68-70` | **DECISÃO D6.** O chat sempre mostra "indisponível" e nunca chama a API. | `onEnviar` não é passado; busca por `api/chat` em `frontend/src`: 0 ocorrências. | FD-014, FU-013 | Confirmado pelo orquestrador |
| H-018 | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:99` | O evento `begin_checkout` nunca é gerado, e o funil do pipeline fica sem essa etapa. | O front sempre envia `ultimaEtapa: "CARRINHO"`; busca por `CHECKOUT_INICIADO` em `frontend/src`: 0 ocorrências. | BV-004, FD-015 | Confirmado pelo orquestrador |
| H-019 | Backend privado | `backend/src/queries/carrinhoQueries.js:96,128` | O evento `add_to_cart` compara quantidades só por SKU: variantes se sobrescrevem e eventos somem ou são inventados. | `itensAnteriores` é um Map por `sku` (linha 96), lido na linha 128. | BV-005, BD-016 | Confirmado pelo orquestrador |
| H-020 | Banco e contratos | `docs/ (arquivo ausente)`<br>`.gitignore:44` | **DECISÃO D9.** O contrato `SCHEMA_PIPELINE_v1.1.md` não existe no disco nem no git, e `docs/` está ignorado. | `ls docs` e `git ls-files docs` sem o arquivo; `git check-ignore` aponta `.gitignore:44`. | BD-004, SG-017 | Confirmado pelo orquestrador |
| H-021 | Banco e contratos | `backend/db/init.sql:1`<br>`backend/docker-compose.yml:15` | Não há migrações: `init.sql` só roda com volume vazio, e no Render nada cria as tabelas. | `backend/db/` tem só `init.sql` e `init_analytics.sql`; o compose é a única referência ao `init.sql`. | BD-008, SG-006 | Confirmado pelo orquestrador |
| H-022 | Banco e contratos | `backend/db/init.sql:89-103,153-160`<br>`backend/scripts/export-novos.js:15-18` | **DECISÃO D1.** Problema conhecido 6, parte do banco: o CHECK aceita PIX, CARTAO e BOLETO, e `parcelas` não existe na tabela, na view nem no CSV. | init.sql:95; view termina em `origem`; busca por `parcelas` e `DEBITO` em backend/src e backend/db: 0 ocorrências. | BD-001, BD-002, BP-003, BV-006, SG-014 | Confirmado pelo orquestrador |
| H-023 | Backend privado | `backend/src/queries/pedidosQueries.js:57-60`<br>`backend/src/routes/carrinho.js:41` | **DECISÃO D1.** Problema conhecido 6, parte da API: a finalização aceita boleto e não trata débito nem parcelas. | Lista fixa em pedidosQueries.js:57; `docs/API.md:59` documenta os mesmos valores. | BP-003, BV-006, FD-016, QA-008, SG-014 | Confirmado pelo orquestrador |
| H-024 | Front UI | `frontend/src/components/PaymentOptions/PaymentOptions.jsx:11,16`<br>`frontend/src/pages/Checkout/CheckoutSuccess.jsx:18-22` | **DECISÃO D1.** Problema conhecido 6, parte da tela: o checkout oferece boleto e não tem débito nem parcelas. | PaymentOptions.jsx:16 é o boleto; a linha 11 é o `CARTAO`, sem parcelas. | FD-016, FU-008, QA-008, BD-002 | Confirmado pelo orquestrador |
| H-025 | Banco e contratos | `backend/scripts/export-novos.js:96-98`<br>`backend/src/queries/integracaoQueries.js:6-7,45-46` | **DECISÃO D9.** A exportação incremental pode perder linhas em silêncio. | A marca é truncada em milissegundos (`toISOString`) e o filtro `>` descarta linhas do mesmo milissegundo. | BD-005, BD-011 | Confirmado pelo orquestrador |
| H-026 | Banco e contratos | `backend/scripts/seed-simulado.js:333-343,398-442` | **DECISÃO D10.** A saída simulada não segue o contrato de colunas e inclui carrinhos ativos. | `data/saida/pedidos.csv` tem cabeçalho `id,...,atualizado_em` e 4850 linhas com CARRINHO_ATIVO. | BD-009 | Confirmado pelo orquestrador |
| H-027 | Segurança e integração | `backend/src/app.js:58-61` | O Express não serve `frontend/dist` nem tem SPA fallback, o que impede o deploy único no Render. | Busca por `express.static` e `sendFile` em backend/src: 0 ocorrências. | SG-004 | Confirmado pelo orquestrador |
| H-028 | Segurança e integração | `backend/src/db.js:10-14`<br>`backend/scripts/seed-catalogo.js:92-96` | Não há suporte a `DATABASE_SSL`, necessário para banco gerenciado. | Busca por `DATABASE_SSL` e `ssl:` em backend/src e backend/scripts: 0 ocorrências. | SG-005 | Confirmado pelo orquestrador |

### MÉDIO (57)

| ID | Bloco | Arquivo:linha | Problema | Evidência | Origem | Verificação |
|---|---|---|---|---|---|---|
| H-029 | Segurança e integração | `backend/src/app.js:23-28` | **DECISÃO D4.** Problema conhecido 1, hipótese de CORS refutada: `FRONT_ORIGIN` não tem efeito e qualquer origem é aceita com credenciais. | A linha 27 retorna `callback(null, true)`. `curl` com origens 5174 e externa refletiu a origem. Impacto limitado: a autenticação usa Bearer. | BP-005, BV-003, BD-018, FD-018, QA-012, SG-003 | Confirmado pelo orquestrador |
| H-030 | Front dados | `frontend/vite.config.js:11-18` | **DECISÃO D4.** Problema conhecido 1, causa da segunda porta: sem `strictPort`, o Vite sobe em 5174 quando 5173 está ocupada. | Bloco `server` sem `port` e `strictPort`. Na auditoria só havia escuta em `[::1]:5173` (`netstat`). | FD-019, SG-019 | Confirmado pelo orquestrador |
| H-031 | Backend público | `backend/src/queries/produtosQueries.js:39-41` | Paginação não inteira, valores gigantes e byte NUL geram 500 em vez de 400. | HTTP 500 com `limite=1.5` e `pagina=1e308`, entre outros (GET real do analista). | BP-004 | Confirmado pelo orquestrador |
| H-032 | Backend público | `backend/src/queries/produtosQueries.js:64-72` | Filtros inválidos falham em silêncio e de forma incoerente. | `precoMin=abc` retorna total 0 e `precoMax=abc` retorna 200 (GET real do analista). | BP-006 | Confirmado pelo orquestrador |
| H-033 | Backend público | `backend/src/queries/produtosQueries.js:51-57` | A busca não trata acento, espaços nem múltiplas palavras. | `busca=calcados` retorna 0, contra 25 de `calçados` (GET real do analista). | BP-007 | Analista |
| H-034 | Backend público | `backend/src/queries/produtosQueries.js:77-112`<br>`frontend/src/pages/Home/Home.jsx:90-92` | **DECISÃO D11.** "Ver catálogo completo" leva a `ordenar=novidades`, que mostra 1 SKU por categoria e não existe no seletor. | `Home.jsx:90,92`; `total=9` na API; opção ausente em `CatalogoHeader.jsx:5-10`. | BP-008, FD-032, FU-034 | Confirmado pelo orquestrador |
| H-035 | Backend público | `backend/src/queries/produtosQueries.js:122-124`<br>`frontend/src/pages/Catalogo/CatalogoHeader.jsx:9` | **DECISÃO D11.** "Melhor avaliados" ordena por popularidade, sem avaliação real. | `notaMedia` é sempre `null` (produtosQueries.js:17). | BP-009 | Analista |
| H-036 | Backend público | `backend/src/db.js:10-14` | Pool sem listener `error` e sem timeouts. | Configuração só com `connectionString`. Queda do processo não reproduzida. | BP-010 | Confirmado pelo orquestrador |
| H-037 | Backend privado | `backend/src/queries/carrinhoQueries.js:32,41-47` | `PUT /api/carrinho` com `{}` ou `itens` inválido apaga o carrinho e responde sucesso. | Default `itens = []` e condição `!Array.isArray(itens)` no ramo que apaga. | BV-011 | Confirmado pelo orquestrador |
| H-038 | Backend privado | `backend/src/queries/carrinhoQueries.js:79-113` | Dois primeiros PUTs simultâneos podem violar o índice único do carrinho ativo. | `FOR UPDATE` não trava linha inexistente; índice em init.sql:106. Não executado. | BV-012 | Confirmado pelo orquestrador |
| H-039 | Backend privado | `backend/src/queries/pedidosQueries.js:183-204` | Cancelamento sem transação: SELECT e UPDATE separados, e o UPDATE filtra só por `id`. | Linhas 184 e 200-203. | BV-013 | Confirmado pelo orquestrador |
| H-040 | Backend privado | `backend/src/routes/enderecos.js:42,70`<br>`backend/src/routes/pedidos.js:21`<br>`backend/src/queries/pedidosQueries.js:69`<br>`backend/src/queries/carrinhoQueries.js:50` | IDs e itens malformados devem gerar 500 em vez de 400 ou 404. | Guarda aceita `1.5` e `1e30` (node). Resposta HTTP não executada. | BV-014 | Analista |
| H-041 | Backend privado | `backend/src/queries/enderecosQueries.js:80-94` | Criações simultâneas podem gerar dois endereços padrão. | Sem trava nem índice parcial em init.sql:57-72. | BV-015 | Analista |
| H-042 | Backend privado | `backend/src/queries/enderecosQueries.js:23-58`<br>`backend/src/routes/usuarios.js:21-25` | Validação fraca de endereço e perfil: tamanho, UF, telefone e tipos. | Leitura das linhas citadas pelo analista. | BV-016 | Analista |
| H-043 | Backend privado | `backend/src/app.js:66` | O handler registra o erro inteiro; em JSON malformado ele carrega o corpo bruto, que pode ter dados pessoais. | app.js:66 e `body-parser/lib/read.js:197` (`body: str`). Log real não inspecionado. | BV-017 | Confirmado pelo orquestrador |
| H-044 | Backend privado | `backend/src/queries/carrinhoQueries.js:19`<br>`backend/src/queries/pedidosQueries.js:103-110` | **DECISÃO D7.** A cesta exibe o preço gravado, mas a finalização cobra o preço atual, sem aviso. | GET usa `preco_unitario`; finalizar usa `preco_atual`. | BV-018 | Confirmado pelo orquestrador |
| H-045 | Backend privado | `backend/db/init.sql:94`<br>`backend/src/queries/pedidosQueries.js:155` | **DECISÃO D8.** O pedido não guarda cópia do endereço: editar ou excluir altera o histórico. | `ON DELETE SET NULL` em init.sql:94. | BV-019 | Confirmado pelo orquestrador |
| H-046 | Backend privado | `backend/src/queries/usuariosQueries.js:44` | O telefone não pode ser apagado: string vazia mantém o valor anterior, e o front mostra sucesso. | `CASE WHEN $4 IS NOT NULL AND $4 <> ''`. | BV-022, FD-025 | Confirmado pelo orquestrador |
| H-047 | Banco e contratos | `backend/src/queries/integracaoQueries.js:38-40,45-46` | **DECISÃO D9.** Na API de integração, `>=` repete a última linha, e a paginação não avança se `limite` linhas tiverem o mesmo `updated_at`. | Linhas 38-39 e 45-46. Rebaixado de ALTO: a repetição é deduplicável e o travamento exige empate em todo o lote. | BD-006 | Confirmado pelo orquestrador |
| H-048 | Banco e contratos | `backend/scripts/seed-simulado.js:11-13` | `npm run seed:simulado` deve falhar: usa `require` em pacote ESM. | `backend/package.json:6` define `"type": "module"`. Script não executado. | BD-010, SG-018 | Confirmado pelo orquestrador |
| H-049 | Banco e contratos | `backend/src/queries/integracaoQueries.js:24` | O CSV não coloca aspas em campo com `\r` isolado. | A condição testa só vírgula, aspas e `\n`. | BD-012 | Confirmado pelo orquestrador |
| H-050 | Banco e contratos | `backend/src/routes/integracao.js:52-56`<br>`backend/src/queries/integracaoQueries.js:35` | `desde` inválido e `limite=1.5` não são validados. | Leitura do código. Resposta HTTP não executada. | BD-013 | Analista |
| H-051 | Banco e contratos | `backend/db/init_analytics.sql:1` | **DECISÃO D12.** Schema paralelo divergente e sem uso. | `git grep init_analytics` sem referências (analista). | BD-014, SG-023 | Analista |
| H-052 | Banco e contratos | `backend/db/init.sql:24,96-98,121,143-144` | Faltam CHECKs de valores monetários, quantidade em eventos e coerência entre status e datas. | init.sql:96-98 sem CHECK. | BD-015 | Confirmado pelo orquestrador |
| H-053 | Segurança e integração | `backend/exports/ (7 arquivos)`<br>`backend/.gitignore:2` | Exports de homologação estão versionados apesar de ignorados. | `git ls-files backend/exports` lista 7 arquivos. | BD-019, SG-010 | Confirmado pelo orquestrador |
| H-054 | Banco e contratos | `docs/API.md:6,12,35-36,51-52,61,63-65,80` | `docs/API.md` diverge do código em formatos, campos e status HTTP. | Ver a seção de divergências. | BD-020, BP-015, BV-026 | Analista |
| H-055 | Front dados | `frontend/src/services/api.js:159-169` | O evento de sessão expirada não tem ouvinte, e um 401 sem JSON nem chega a dispará-lo. | Única ocorrência de `horizonte:sessao-expirada` em `frontend/src`: api.js:168. | FD-020 | Confirmado pelo orquestrador |
| H-056 | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:44-46`<br>`frontend/src/context/FavoritosContextProvider.jsx:30-32`<br>`frontend/src/hooks/usePerfil.js:30-32` | Ao sair, o estado não é limpo, e o próximo usuário pode herdar a cesta anterior. | Os efeitos retornam sem limpar quando `usuario` é nulo. | FD-021 | Confirmado pelo orquestrador |
| H-057 | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:81-119`<br>`frontend/src/context/FavoritosContextProvider.jsx:77-81` | Cliques rápidos usam estado antigo, e respostas fora de ordem desfazem alterações. | Snapshot vem do closure; PUT sem fila. | FD-022 | Analista |
| H-058 | Front UI | `frontend/src/pages/Carrinho/Carrinho.jsx:88,102`<br>`frontend/src/components/AddressCard/AddressCard.jsx:40,94`<br>`frontend/src/components/OrderCard/OrderCard.jsx:63`<br>`frontend/src/components/ProductCard/ProductCard.jsx:51`<br>`frontend/src/pages/Produto/Produto.jsx:178`<br>`frontend/src/pages/Favoritos/Favoritos.jsx:120` | Ações assíncronas sem `catch` geram rejeição não tratada. | Rebaixado de ALTO: na cesta e nos favoritos o provider já grava `erro` antes de relançar. | FD-023, FU-016 | Confirmado pelo orquestrador |
| H-059 | Front dados | `frontend/src/hooks/useProduto.js:22-48`<br>`frontend/src/hooks/useProdutos.js:47-91`<br>`frontend/src/pages/Produto/Produto.jsx:61-62` | Ao trocar de produto ou filtro, erro, dados e cor escolhida anteriores permanecem. | Leitura do analista. | FD-024 | Analista |
| H-060 | Front UI | `frontend/src/pages/Perfil/Perfil.jsx:51-59,135`<br>`frontend/src/pages/Perfil/PerfilDadosSection.jsx:26` | O telefone salvo pode aparecer vazio no formulário. | A `key` usa só e-mail e nome. Refutado em parte: o valor não é apagado no banco, pois `usuariosQueries.js:44` ignora string vazia. | FU-007 | Confirmado pelo orquestrador |
| H-061 | Front UI | `frontend/src/components/Pagination/Pagination.jsx:19`<br>`frontend/src/components/Pagination/Pagination.module.css:1-18` | A paginação lista todas as 17 páginas sem quebra de linha e deve estourar a largura. | Sem `flex-wrap` (confirmado). Rebaixado de ALTO: estouro é previsão por CSS, não renderizada. | FU-014 | Confirmado pelo orquestrador |
| H-062 | Front UI | `frontend/src/components/Header/Header.module.css:13-25,34-37,103-107` | O header deve estourar em 390 px. | Rebaixado de ALTO: as larguras de texto são estimadas e não houve renderização. | FU-015 | Confirmado pelo orquestrador |
| H-063 | Front UI | `frontend/src/components/Layout/Layout.jsx:26`<br>`frontend/src/pages/Favoritos/Favoritos.jsx:162`<br>`frontend/src/pages/Home/Home.jsx:62` | `<main>` dentro de `<main>` e margem lateral dobrada. | Layout.jsx:26 e `Carrinho.jsx:61` usam `main.container`. | FU-018 | Confirmado pelo orquestrador |
| H-064 | Front UI | `frontend/src/pages/Produto/Produto.jsx:133-136` | Roupa infantil aparece como "Número (calçado)". | Leitura do analista. | FU-019 | Analista |
| H-065 | Front UI | `frontend/src/pages/Produto/Produto.jsx:228-229,256,300` | O resumo de avaliações nunca aparece. | API fixa `notaMedia: null` (produtosQueries.js:17). | FU-020 | Analista |
| H-066 | Front UI | `frontend/src/pages/Home/Home.jsx:85-87,126`<br>`frontend/src/pages/Produto/ProductAccordions.jsx:14,20-21` | **DECISÃO D11.** Novidades e descrições sem rótulo SIMULADO, e o texto promete envio ao Brasil todo. | Leitura do analista; regra D-19. | FU-021 | Analista |
| H-067 | Front UI | `frontend/src/components/CartItem/CartItem.jsx:66`<br>`frontend/src/components/OrderCard/OrderCard.jsx:134` | Produto sem cor ou tamanho mostra rótulo vazio. | CartItem.jsx:66 imprime os dois rótulos sempre. | FU-022, FD-031 | Confirmado pelo orquestrador |
| H-068 | Front UI | `frontend/src/components/OrderCard/OrderCard.jsx:98` | Chave React duplicada com duas variantes do mesmo SKU. | A `key` usa só pedido e SKU. | FU-023 | Confirmado pelo orquestrador |
| H-069 | Front UI | `frontend/src/pages/Produto/ProductColorSelector.jsx:27`<br>`frontend/src/pages/Produto/ProductSizeSelector.jsx:43`<br>`frontend/src/components/PaymentOptions/PaymentOptions.jsx:34` | Grupos de opção com semântica errada ou sem nome. | Leitura do analista. | FU-024 | Analista |
| H-070 | Front UI | `frontend/src/components/ChatWidget/ChatWidget.module.css:42-45` | Foco invisível no botão do chat. | Contraste 1,00:1 calculado sobre tokens. Não renderizado. | FU-025 | Analista |
| H-071 | Front UI | `frontend/src/components/FilterPanel/FilterPanel.jsx:62-65` | Filtro fechado no mobile continua recebendo foco por Tab. | Só usa `translateX(100%)`, segundo o analista. | FU-026 | Analista |
| H-072 | Front UI | `frontend/src/components/Header/Header.module.css:94,100` | Texto secundário reprova AA no tema claro. | 4,34:1 calculado sobre tokens. Não renderizado. | FU-027 | Analista |
| H-073 | Front UI | `frontend/src/pages/Login/LoginBanner.jsx:10,12` | Link focável dentro de `aria-hidden="true"`. | Leitura do analista. | FU-028 | Analista |
| H-074 | Front UI | `frontend/src/pages/Login/Login.module.css:160` | Campo de senha sem borda visível. | `border: 1px solid transparent`, segundo o analista. | FU-029 | Analista |
| H-075 | Front UI | `frontend/src/pages/Home/HomeHero.jsx:26-31`<br>`frontend/src/pages/Home/EditorialBanner.jsx:17-22` | Botão dentro de link: HTML inválido. | Leitura do analista. | FU-030 | Analista |
| H-076 | Front UI | `frontend/src/components/ui/QuantityStepper/QuantityStepper.module.css:17-20` | Alvos de toque abaixo de 44 px. | Medidas de CSS; regra em `docs/DESIGN.md:199`. | FU-031 | Analista |
| H-077 | Front dados | `frontend/src/hooks/useProdutos.js:47-69`<br>`frontend/src/components/FilterPanel/FilterPanel.jsx:125,133` | Ao filtrar não há indicação de carga, e cada dígito do preço dispara uma busca. | Leitura do analista. | FU-032 | Analista |
| H-078 | Front UI | `frontend/src/pages/Catalogo/Catalogo.jsx:132-139,204-205` | "Limpar filtros" não faz nada quando o vazio vem da busca. | A função preserva `busca`, segundo o analista. | FU-033 | Analista |
| H-079 | Segurança e integração | `backend/src/app.js:21-39` | **DECISÃO D13.** Sem rate limit global e sem `trust proxy`. | Busca por `trust proxy`: 0 ocorrências. Só `/api/chat` tem limite. | SG-007 | Confirmado pelo orquestrador |
| H-080 | Segurança e integração | `backend/src/app.js:15` | Sem headers de segurança, e `X-Powered-By` segue ativo. | Leitura de app.js. | SG-008 | Analista |
| H-081 | Segurança e integração | `backend/docker-compose.yml:7,10` | Postgres publicado em todas as interfaces, com senha padrão como fallback. | Compose linhas 7 e 10; `netstat` mostra `0.0.0.0:5432`. | SG-009 | Confirmado pelo orquestrador |
| H-082 | Segurança e integração | `.gitignore:44-45` | **DECISÃO D12.** `docs/` está ignorado, mas 14 documentos seguem rastreados. Documentos novos ficam fora do git. | `git check-ignore -v docs/analise` aponta `.gitignore:44`. | SG-011 | Confirmado pelo orquestrador |
| H-083 | Segurança e integração | `.gitignore:19-23` | Faltam padrões para service account, `*.pem` e `*.key`. | Exigência em `frontend/src/AGENTS.md:89`. | SG-012 | Analista |
| H-084 | Segurança e integração | `frontend/package.json:13` | `npm audit --omit=dev`: 4 altas no frontend e 4 na raiz (`@grpc/grpc-js`); backend sem achados. | Saída do analista. Não há import de Firestore em `frontend/src`. | SG-013 | Analista |
| H-085 | Segurança e integração | `docs/STATUS.md:7,11-12,73,125`<br>`docs/PROJECT.md:15,38` | Documentação desatualizada, incluindo a afirmação de testes em 390/768/1440 (problema conhecido 7). | STATUS.md:68 segue pendente enquanto as linhas 73 e 125 afirmam teste. | SG-016 | Confirmado pelo orquestrador |

### BAIXO (31)

| ID | Bloco | Arquivo:linha | Problema | Evidência | Origem | Verificação |
|---|---|---|---|---|---|---|
| H-086 | Backend público | `backend/src/routes/health.js:5-7` | O health responde `ok` sem consultar o banco. | Resposta fixa. | BP-011 | Analista |
| H-087 | Backend público | `backend/src/app.js:68-73` | Erros 4xx expõem mensagens internas em inglês. | app.js:73 devolve `erro.message`. | BP-012 | Analista |
| H-088 | Backend público | `backend/src/queries/produtosQueries.js:52` | `%` e `_` na busca funcionam como curingas. | `busca=%25` retorna os 200 produtos. | BP-013 | Analista |
| H-089 | Backend público | `backend/src/queries/produtosQueries.js:6-19` | **DECISÃO D12.** O campo `imagens` do checklist não existe na API. | 0 de 200 produtos têm a chave. | BP-014 | Analista |
| H-090 | Backend público | `backend/scripts/seed-catalogo.js:63` | Cor desconhecida vira marrom sem aviso. | Sem impacto nos dados atuais. | BP-016 | Analista |
| H-091 | Backend privado | `backend/src/services/analyticsService.js:7,42,77` | Coleções em memória crescem sem limite, e o token é verificado duas vezes. | analyticsService.js:42 marca a sessão antes do INSERT. | BP-017, BV-024 | Analista |
| H-092 | Backend público | `backend/db/init.sql:34-36` | Sem índice para preço, tamanhos ou busca textual. | Respostas de 7 a 110 ms com 200 produtos. | BP-018 | Analista |
| H-093 | Backend privado | `backend/src/queries/carrinhoHelpers.js:37-38` | Quantidade aceita `true` e `[3]`. | `Number(item.quantidade)` na linha 37. | BV-021 | Analista |
| H-094 | Backend privado | `backend/src/routes/chat.js:25,54,65` | `sessaoId` do corpo vai ao ADK sem validação. | Leitura do analista. | BV-023 | Analista |
| H-095 | Backend privado | `backend/src/queries/carrinhoQueries.js:70`<br>`backend/src/queries/pedidosQueries.js:113` | `FRETE_SIMULADO=0` vira R$ 15,00, e a regra está duplicada. | pedidosQueries.js:113 usa `\|\| 15.0`. | BV-025 | Analista |
| H-096 | Banco e contratos | `backend/db/init.sql:94,118-119,145` | Faltam índices em chaves estrangeiras. | Leitura do analista. | BD-021 | Analista |
| H-097 | Banco e contratos | `backend/db/init.sql:91` | **DECISÃO D12.** `pedidos.usuario_id` não tem FK para `usuarios`. | init.sql:91. | BD-022 | Analista |
| H-098 | Banco e contratos | `backend/src/services/analyticsService.js:45-55` | `session_start` pode duplicar em requisições simultâneas. | Sem índice único. | BD-023 | Analista |
| H-099 | Banco e contratos | `backend/scripts/export-novos.js:100-115` | Gera CSV só com cabeçalho e salva a marca apenas no fim. | export-novos.js:102 e 113-115. | BD-024 | Analista |
| H-100 | Segurança e integração | `backend/scripts/test-b3b.js:92,105`<br>`backend/exports/` | **DECISÃO D14.** Dados de homologação precisam ser limpos antes da extração. | Contagens na seção de dados de teste. | BD-025, SG (dados de homologação) | Analista |
| H-101 | Front dados | `frontend/vite.config.js:6` | `frontend/.env` não é usado, pois o Vite lê a raiz. | `envDir: ".."`. Conteúdo não lido. | FD-026, SG-020 | Confirmado pelo orquestrador |
| H-102 | Front dados | `frontend/src/context/AuthContextProvider.jsx:16-31` | `auth/unauthorized-domain` não tem tradução. | Código ausente do mapa. | FD-027 | Analista |
| H-103 | Front dados | `frontend/src/api/`<br>`frontend/src/ProductSilhouette/`<br>`frontend/src/hooks/index.js` | **DECISÃO D12.** Código sem uso e pasta duplicada. | Sem importadores (analistas). | FD-028, FU-040 | Analista |
| H-104 | Front dados | `frontend/src/services/api.js:3` | Import dinâmico sem efeito e bundle JS de 541,58 kB. | Avisos do build. | FD-029, QA-014 | Analista |
| H-105 | Front dados | `frontend/src/services/mapeadores.js:51-55,167,208,263` | Resposta 200 com formato inesperado vira lista vazia. | Leitura do analista. | FD-030 | Analista |
| H-106 | Front dados | `frontend/src/pages/Produto/Produto.jsx:196-201` | Item novo aparece por instantes com nome vazio e preço 0. | `CarrinhoContextProvider.jsx:160-161`. | FD-033 | Analista |
| H-107 | Front dados | `frontend/src/hooks/useProdutos.js:31-39` | O debounce de 300 ms só atrasa a busca. | A busca vem da URL. | FD-034 | Analista |
| H-108 | Front UI | `frontend/src/components/ui/ProductImage/ProductImage.module.css:34` | Cores claras somem no tema claro e escuras no tema escuro. | Contraste calculado. Não renderizado. | FU-035 | Analista |
| H-109 | Front UI | `frontend/src/components/ChatWidget/ChatWidget.module.css:23-141` | Desvios das regras de estilo: `!important`, `rgba` soltos e um hex no JSX. | Lista completa em FU-036. | FU-036 | Analista |
| H-110 | Front UI | `frontend/src/components/ProductSilhouette/ProductSilhouette.jsx:9,16` | A cor entra sem validação em `dangerouslySetInnerHTML`. | Interpolação direta no SVG. | FU-037 | Analista |
| H-111 | Front UI | `frontend/src/pages/Perfil/PerfilEnderecosSection.jsx:41-46` | Endereço salvo sem mensagem de sucesso. | `docs/DESIGN.md:187` pede mensagem curta. | FU-038 | Analista |
| H-112 | Front UI | `docs/DESIGN.md:65,113,134,172`<br>`frontend/src/pages/Termos/Termos.jsx:28-29` | Documentos citam boleto e divergem do código. | Leitura do analista. | FU-039 | Analista |
| H-113 | QA | `backend/package.json:7-13`<br>`frontend/package.json:6-11` | Não há script `test` nem arquivos de teste automatizado. | Scripts em backend/package.json:7-13; lint limpo não detectou os críticos. | QA-013 | Confirmado pelo orquestrador |
| H-114 | Segurança e integração | `backend/.env.example:8,21,26` | O exemplo traz valores e não lista `NODE_ENV` nem `DATABASE_SSL`. | Linhas citadas. | SG-021 | Analista |
| H-115 | Segurança e integração | `backend/db/init.sql:155,173` | `usuario_hash` é SHA-256 truncado sem salt. | init.sql:155. | SG-022 | Analista |
| H-116 | Segurança e integração | `package.json:2-7` | Dependências na raiz, incluindo `axios`, vedado pela decisão do projeto. | 0 usos de `axios` em frontend/src e backend/src (analista). | SG-024 | Analista |

### Ajustes feitos na consolidação

- **Elevados a CRÍTICO:** bypass de autenticação (FD-017, QA-009) e falhas de função central (BV-007, BV-008, BV-009, QA-004, QA-006).
- **Rebaixados de CRÍTICO para ALTO:** BD-001 e BD-002, porque o contrato que definiria a exigência não está no repositório.
- **Rebaixados de ALTO para MÉDIO:** BV-003 e SG-003 (a autenticação usa Bearer), BD-006, FU-014, FU-015 (previsões sem renderização) e FU-016.
- **Refutado em parte:** FU-007 dizia que o telefone seria apagado ao salvar. `backend/src/queries/usuariosQueries.js:44` ignora string vazia, então o valor continua no banco.
- **Contradição resolvida:** QA-001 sugeria mudar o hook de favoritos, e FD-001 sugeria mudar a página. Vale a página, porque o hook já expõe `favoritos`.

## 5. Divergências entre contrato, código e docs

| Tema | Contrato ou doc | Código | Quem deve mudar |
|---|---|---|---|
| Contrato do pipeline | `SCHEMA_PIPELINE_v1.1.md` citado, mas ausente | Views e CSV sem referência verificável | Obter o arquivo com o Diego |
| `parcelas` | Exigida na lista de colunas do analista | Ausente de tabela, view e CSV | Banco, exportação e API.md |
| Forma de pagamento | Regra nova: PIX, crédito e débito | `docs/API.md:59` e D-12 mantêm PIX, CARTAO e BOLETO, como o código | Banco, código, API.md e D-12 |
| Cor do item | `docs/API.md:31` só com o nome | Só o nome | Código e API.md |
| Limite de novidades | D-25: padrão 8 | `produtosQueries.js:36`: padrão 12 | Código |
| Filtro incremental | `init_analytics.sql:92` documenta `>` | `integracaoQueries.js:38` usa `>=` | Código e API.md |
| Formato do JSON de integração | `docs/API.md:6`: camelCase e número | snake_case e decimais como texto | API.md |
| Status HTTP | `docs/API.md:80`: 400, 401, 404 e 500 | Também 201, 409, 429 e 503 | API.md |
| Testes de tela | `docs/STATUS.md:73,125` afirma testes | Item pendente em `docs/STATUS.md:68` | STATUS.md |

## 6. Lint, build e testes

| Verificação | Resultado | Evidência |
|---|---|---|
| Lint do front | PASSOU | `npm --prefix frontend run lint`, exit 0 |
| Build do front | PASSOU | `npm --prefix frontend run build` com `--outDir` temporário, exit 0, 2297 módulos, JS de 541,58 kB e 2 avisos |
| Testes automatizados | NÃO EXISTEM | Sem script `test` em `backend/package.json:7-13` e `frontend/package.json:6-11` |
| GET públicos da API | PASSOU | health, categorias, produtos, produto HZ-MAS-018 e 404 de SKU inexistente |
| `npm audit --omit=dev` | 4 altas no front, 4 altas na raiz, 0 no backend | Saída do analista de segurança |
| Fluxos de tela | NÃO VERIFICADO | Sem conta de teste e sem navegador em uso |

## 7. NÃO VERIFICADO

- Fluxos de tela e autenticados: nenhuma tela foi aberta e nenhuma rota privada foi chamada com login. Os achados de interface vêm de leitura de código.
- Responsividade em 390, 768 e 1440 px, temas, contraste real, foco e leitor de tela.
- Valores reais de `NODE_ENV`, `FRONT_ORIGIN`, `VITE_API_URL` e `INTEGRACAO_API_KEY`, pois nenhum `.env` foi lido. Por isso não se sabe se o bypass está ativo no processo atual nem se a chave publicada é a chave em uso.
- Domínios autorizados e usuários de teste no console do Firebase.
- Comportamento com a API fora do ar. A API não foi derrubada.
- Rotas `/api/integracao/*`, `export:novos`, seeds e migrações, que não foram executados.
- Colunas exportadas contra o contrato real, ausente do repositório.
- Instabilidade da API: o PID da porta 3000 mudou de 16840 para 5504 às 16:12 durante a análise do backend público. A causa não foi determinada, e não se pode descartar relação com as requisições da própria auditoria.
- Visibilidade do repositório no GitHub, regras de firewall e comportamento real no Render.
- Concorrência real e os status 500 previstos em H-038 e H-040.

## 8. Decisões pendentes

| ID | Tema | O que decidir | Itens |
|---|---|---|---|
| D1 | Pagamento | Definir os valores (sugestão: `PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO`), o máximo de parcelas e o destino dos pedidos antigos com `CARTAO` ou `BOLETO`. Revisa a D-12 e precisa ser alinhado com o Diego. | H-022, H-023, H-024 |
| D2 | Chave publicada | Confirmar se o valor é a chave em uso e trocá-la. Reescrever o histórico de `origin/dev` é opcional e afeta o grupo; a recomendação é só trocar. | H-002 |
| D3 | Bypass de teste | Remover os tokens `test:` e `mock:` (recomendado) ou mantê-los atrás de uma flag desligada por padrão. | H-001 |
| D4 | Portas e origens | Manter só a 5173 (recomendado) ou autorizar também a 5174, e informar a URL de produção. | H-029, H-030 |
| D5 | `corHex` na API | Aprovar o campo novo no contrato público (recomendado) em vez de buscar cada produto no front. | H-014 |
| D6 | Chat | Conectar agora ou ocultar o widget até o ADK estar disponível. | H-017 |
| D7 | Mudança de preço | Atualizar em silêncio, avisar o cliente ou bloquear com 409 quando o preço mudar entre a cesta e a finalização. | H-044 |
| D8 | Endereço no pedido | Guardar cópia completa ou só cidade e UF. | H-045 |
| D9 | Pipeline | Com o Diego: fornecer o contrato, aceitar entrega "pelo menos uma vez" com deduplicação e definir o `valor` dos eventos (`begin_checkout` usa subtotal, `purchase` usa total com frete). | H-020, H-025, H-047 |
| D10 | Carrinhos e avaliações no BI | Definir de onde sai o abandono de carrinho e se o contrato exige o CSV de `avaliacoes`. | H-026 |
| D11 | Textos de vitrine | Definir o destino do link de novidades, o futuro de "Melhor avaliados" e o texto do rótulo SIMULADO. | H-034, H-035, H-066 |
| D12 | Organização do repositório | Definir se `docs/` é versionada, se `init_analytics.sql` e o código morto saem, se `pedidos.usuario_id` ganha FK e se `imagens` entra na API. | H-051, H-082, H-089, H-097, H-103 |
| D13 | Rate limit | Adotar `express-rate-limit` (biblioteca nova, exige aval) ou implementação própria. | H-079 |
| D14 | Limpeza de dados | Indicar quais usuários são reais e quais contas de teste saem do banco e do Firebase. | H-100 |
| D15 | Prazo de cancelamento | Hoje qualquer pedido finalizado pode ser cancelado a qualquer momento. Confirmar se a regra fica assim. | — |

## 9. Ordem sugerida de correção

**Item mais urgente de cada dono:**

- `corretor-backend`: **H-001** (CRÍTICO).
- `corretor-banco-contratos`: **H-020** (ALTO).
- `corretor-front-dados`: **H-006** (CRÍTICO).
- `corretor-front-ui`: **H-003** (CRÍTICO).

**Sequência:**

1. **Segurança:** H-001 e H-002.
2. **Fluxos quebrados:** H-003, H-010 com H-004, H-005, H-006, H-008 com H-007.
3. **Estado da cesta e das telas:** H-009, H-011, H-012, H-013 e H-016.
4. **Cor das silhuetas e eventos:** H-014, H-015, H-018 e H-019.
5. **Pagamento, depois da D1:** H-020, H-021, H-022, H-023 e H-024.
6. **Exportação e deploy:** H-025, H-026, H-027 e H-028.
7. **Demais itens** por gravidade.

## 10. Dados de teste e notas de execução

**Dados de teste criados nesta análise: nenhum.** Nenhuma conta foi criada, nada foi gravado no banco e os GET foram feitos sem `X-Sessao-Id`, o que evita eventos de analytics.

**Dados de homologação já existentes** (contagens lidas pelo analista de segurança, sem dados pessoais na saída):

| Tabela | Registros |
|---|---:|
| `loja.usuarios` | 10 (3 sintéticos por padrão de uid ou e-mail, 7 sem classificação) |
| `loja.enderecos` | 9 |
| `loja.favoritos` | 6 |
| `loja.pedidos` | 5 finalizados e 2 carrinhos ativos |
| `loja.pedido_itens` | 11 |
| `loja.analytics_eventos` | 51 |

**Notas de execução:**

- O kit está em `kit-claude-horizonte/.claude/`, não em `.claude/` na raiz. Por isso os 7 analistas rodaram como agentes sem ferramentas de edição, cada um seguindo o seu arquivo de definição.
- O analista de segurança consultou o banco por conta própria com `docker exec` no contêiner `horizonte_postgres`, em sessão `default_transaction_read_only=on`. Foram 10 consultas `SELECT` de contagem. Nenhum `.env` foi aberto.
- O analista de QA compilou o front em memória, sem gravar arquivos. O build completo foi executado pelo analista de dados do front, em pasta temporária; `frontend/dist` não foi alterado.
- `docs/` está ignorada em `.gitignore:44`, portanto estes dois arquivos não aparecem no `git status`.
