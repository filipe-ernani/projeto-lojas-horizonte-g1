# Backlog de correções: Lojas Horizonte

**Data:** 2026-11-18 · **Origem:** [RELATORIO_ANALISE_2026-11-18.md](RELATORIO_ANALISE_2026-11-18.md) · **Total:** 116 itens (7 críticos, 21 altos, 57 médios, 31 baixos)

Ordenado por gravidade e, dentro dela, por dependência. **DECISÃO** indica item que exige escolha do Caio. Esforço: P (pequeno), M (médio), G (grande).

## Mais urgente por dono

- `corretor-backend`: **H-001**. Tokens `test:` e `mock:` autenticam qualquer uid sem verificação quando `NODE_ENV` difere de `production`.
- `corretor-banco-contratos`: **H-020**. O contrato `SCHEMA_PIPELINE_v1.1.md` não existe no disco nem no git, e `docs/` está ignorado.
- `corretor-front-dados`: **H-006**. Cancelar pedido gera TypeError: a página pede `cancelarPedido` e `cancelando`, que o hook não devolve.
- `corretor-front-ui`: **H-003**. Problema conhecido 5: /favoritos fica em tela branca.

## Itens

| ID | Gravidade | Bloco | Arquivo:linha | Problema | Correção | Esforço | Dono | Depende de | Status |
|---|---|---|---|---|---|---|---|---|---|
| H-001 | CRÍTICO | Segurança e integração | `backend/src/middlewares/auth.js:21-30` | **DECISÃO D3.** Tokens `test:` e `mock:` autenticam qualquer uid sem verificação quando `NODE_ENV` difere de `production`. | Remover o atalho ou exigir flag explícita de teste, desligada por padrão. Ajustar `backend/scripts/test-b3b.js:7`. | P | corretor-backend | D3 | CORRIGIDO (revisor: CONFIRMADO) |
| H-002 | CRÍTICO | Segurança e integração | `backend/scripts/test-b3b.js:134` | **DECISÃO D2.** Valor literal de X-API-Key em script versionado e publicado em `origin/dev` (valor omitido neste relatório). | Tratar como vazada: trocar `INTEGRACAO_API_KEY` e ler o valor de variável de ambiente no script. | P | corretor-backend + Caio (troca da chave) | D2 | CORRIGIDO (revisor: CONFIRMADO) |
| H-003 | CRÍTICO | Front UI | `frontend/src/pages/Favoritos/Favoritos.jsx:28,39,156` | Problema conhecido 5: /favoritos fica em tela branca. | Usar `favoritos: itensApi` e proteger a linha 156 com `temProdutos`. | P | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-004 | CRÍTICO | Front UI | `frontend/src/pages/Perfil/Perfil.jsx:36,82` | Problema conhecido 3: salvar perfil falha com "salvarPerfilApi is not a function". | Usar `salvar: salvarPerfilApi`, junto com a correção de estado do hook. | P | corretor-front-ui | H-010 | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-005 | CRÍTICO | Front UI | `frontend/src/pages/Perfil/Perfil.jsx:44-46,90,92,99` | Problema conhecido 4, maior que o relatado: criar, editar e excluir endereço falham. Sem endereço, a compra não finaliza. | Renomear na desestruturação: `criar: criarEndereco`, `editar: editarEndereco`, `excluir: excluirEndereco`. | P | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-006 | CRÍTICO | Front UI | `frontend/src/pages/Pedidos/Pedidos.jsx:26-27,46`<br>`frontend/src/hooks/usePedidos.js:61-68` | Cancelar pedido gera TypeError: a página pede `cancelarPedido` e `cancelando`, que o hook não devolve. | Criar o estado `cancelando` no hook e usar `cancelar: cancelarPedido` na página. | P | corretor-front-dados + corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-007 | CRÍTICO | Front dados | `frontend/src/pages/Carrinho/Carrinho.jsx:88-93`<br>`frontend/src/context/CarrinhoContextProvider.jsx:177` | Os botões + e − da cesta sempre gravam quantidade 1. | Alinhar a assinatura, identificando o item por sku + tamanho + cor. | M | corretor-front-dados + corretor-front-ui | H-008 | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-008 | ALTO | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:186-200,216-221`<br>`frontend/src/components/CartItem/CartItem.jsx:37,43` | Alterar ou remover um item afeta todas as variantes do mesmo SKU. | Usar chave composta `produtoId + tamanho + cor` em toda a cadeia. | M | corretor-front-dados + corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-009 | ALTO | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:81,86,97` | Perda de dados: adicionar antes do GET terminar, ou depois de ele falhar, parte de `itens=[]` e o PUT substitui a cesta no servidor. | Bloquear mutações até a cesta carregar com sucesso. | M | corretor-front-dados | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-010 | ALTO | Front dados | `frontend/src/hooks/usePerfil.js:60,68`<br>`frontend/src/pages/Perfil/Perfil.jsx:110,114` | Salvar perfil troca o formulário pelo skeleton; em falha, mostra "Não foi possível carregar seu perfil" e perde o que foi digitado. | Criar estado próprio `salvando` e não gravar erro de salvamento em `erro`. | P | corretor-front-dados | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-011 | ALTO | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:34`<br>`frontend/src/context/FavoritosContextProvider.jsx:20`<br>`frontend/src/hooks/useEnderecos.js:19`<br>`frontend/src/hooks/usePedidos.js:13`<br>`frontend/src/hooks/usePerfil.js:21` | `carregando` nunca liga na carga: a tela mostra "cesta vazia" ou "sem pedidos" enquanto os dados chegam. | Iniciar a carga com `carregando` ligado quando houver usuário. | M | corretor-front-dados | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-012 | ALTO | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:38-40`<br>`frontend/src/context/FavoritosContextProvider.jsx:24-26`<br>`frontend/src/hooks/useEnderecos.js:23-25`<br>`frontend/src/hooks/usePedidos.js:17-19`<br>`frontend/src/hooks/usePerfil.js:25-27` | "Tentar de novo" não sai da tela de erro, mesmo quando a nova busca dá certo. | Limpar `erro` em `recarregar` e no sucesso da carga. | P | corretor-front-dados | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-013 | ALTO | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:115`<br>`frontend/src/context/FavoritosContextProvider.jsx:118` | Falha ao alterar item grava no mesmo `erro` da carga e derruba a página inteira da cesta, do checkout ou dos favoritos. | Separar erro de carga de erro de ação; o segundo vira aviso. | M | corretor-front-dados | H-012 | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-014 | ALTO | Backend privado | `backend/src/queries/carrinhoHelpers.js:22`<br>`backend/src/queries/carrinhoQueries.js:19,159`<br>`backend/src/queries/pedidosQueries.js:45,90,165` | **DECISÃO D5.** Problema conhecido 2, parte da API: carrinho e pedidos devolvem só o nome da cor. | Devolver `corHex` no GET e no PUT do carrinho e em pedidos. Atualizar `docs/API.md:31`. | M | corretor-backend | D5 | CORRIGIDO (revisor: CONFIRMADO) |
| H-015 | ALTO | Front UI | `frontend/src/services/mapeadores.js:127`<br>`frontend/src/components/CartItem/CartItem.jsx:55`<br>`frontend/src/components/OrderCard/OrderCard.jsx:102,122` | Problema conhecido 2, parte do front: o mapeador descarta o hex e os componentes não passam `cor`. | Preservar `corHex` no mapeador e passar `cor={item.corHex}`. Não enviar o nome da cor ao SVG. | P | corretor-front-dados + corretor-front-ui | H-014 | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-016 | ALTO | Front UI | `frontend/src/main.jsx:14-26`<br>`frontend/src/App.jsx:18-52` | Sem ErrorBoundary, qualquer erro de renderização vira tela branca. | Envolver as rotas com um ErrorBoundary com mensagem em português. | P | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-017 | ALTO | Front UI | `frontend/src/components/Layout/Layout.jsx:30`<br>`frontend/src/components/ChatWidget/ChatWidget.jsx:68-70` | **DECISÃO D6.** O chat sempre mostra "indisponível" e nunca chama a API. | Criar o service e ligar no Layout, ou ocultar o widget. | P | corretor-front-dados + corretor-front-ui | D6 | ENCERRADO (D6: o widget não muda) |
| H-018 | ALTO | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:99` | O evento `begin_checkout` nunca é gerado, e o funil do pipeline fica sem essa etapa. | Enviar `CHECKOUT_INICIADO` uma vez ao abrir o checkout. | P | corretor-front-dados | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-019 | ALTO | Backend privado | `backend/src/queries/carrinhoQueries.js:96,128` | O evento `add_to_cart` compara quantidades só por SKU: variantes se sobrescrevem e eventos somem ou são inventados. | Usar a chave `sku + tamanho + cor`. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-020 | ALTO | Banco e contratos | `docs/ (arquivo ausente)`<br>`.gitignore:44` | **DECISÃO D9.** O contrato `SCHEMA_PIPELINE_v1.1.md` não existe no disco nem no git, e `docs/` está ignorado. | Obter o contrato com o Diego e versioná-lo. | P | corretor-banco-contratos + Caio | D9 | ADIADO (D8, D9 ou D10) |
| H-021 | ALTO | Banco e contratos | `backend/db/init.sql:1`<br>`backend/docker-compose.yml:15` | Não há migrações: `init.sql` só roda com volume vazio, e no Render nada cria as tabelas. | Criar migrações idempotentes e incluí-las no roteiro de deploy. | M | corretor-banco-contratos | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-022 | ALTO | Banco e contratos | `backend/db/init.sql:89-103,153-160`<br>`backend/scripts/export-novos.js:15-18` | **DECISÃO D1.** Problema conhecido 6, parte do banco: o CHECK aceita PIX, CARTAO e BOLETO, e `parcelas` não existe na tabela, na view nem no CSV. | Migrar o domínio, criar `parcelas` e acrescentá-la no fim da view. | M | corretor-banco-contratos | D1, H-021, H-020 | CORRIGIDO (revisor: CONFIRMADO) |
| H-023 | ALTO | Backend privado | `backend/src/queries/pedidosQueries.js:57-60`<br>`backend/src/routes/carrinho.js:41` | **DECISÃO D1.** Problema conhecido 6, parte da API: a finalização aceita boleto e não trata débito nem parcelas. | Validar os novos valores e as parcelas. Atualizar `docs/API.md` e a D-12. | M | corretor-backend | D1, H-022 | CORRIGIDO (revisor: CONFIRMADO) |
| H-024 | ALTO | Front UI | `frontend/src/components/PaymentOptions/PaymentOptions.jsx:11,16`<br>`frontend/src/pages/Checkout/CheckoutSuccess.jsx:18-22` | **DECISÃO D1.** Problema conhecido 6, parte da tela: o checkout oferece boleto e não tem débito nem parcelas. | Trocar as opções, incluir parcelas e manter o rótulo SIMULADO. | M | corretor-front-ui | D1, H-023 | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-025 | ALTO | Banco e contratos | `backend/scripts/export-novos.js:96-98`<br>`backend/src/queries/integracaoQueries.js:6-7,45-46` | **DECISÃO D9.** A exportação incremental pode perder linhas em silêncio. | Trocar por `>=` com janela de sobreposição e deduplicar por ID. | M | corretor-backend + corretor-banco-contratos | D9 | CORRIGIDO (revisor: CONFIRMADO) |
| H-026 | ALTO | Banco e contratos | `backend/scripts/seed-simulado.js:333-343,398-442` | **DECISÃO D10.** A saída simulada não segue o contrato de colunas e inclui carrinhos ativos. | Alinhar ao contrato depois da decisão sobre carrinhos no BI. | M | corretor-backend | D10, H-020 | ADIADO (D8, D9 ou D10) |
| H-027 | ALTO | Segurança e integração | `backend/src/app.js:58-61` | O Express não serve `frontend/dist` nem tem SPA fallback, o que impede o deploy único no Render. | Servir `dist` e `index.html` antes do 404. Definir build e start. | M | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-028 | ALTO | Segurança e integração | `backend/src/db.js:10-14`<br>`backend/scripts/seed-catalogo.js:92-96` | Não há suporte a `DATABASE_SSL`, necessário para banco gerenciado. | Configurar `ssl` no Pool por variável e documentar. | P | corretor-backend | — | PARCIAL (código CONFIRMADO; DATABASE_SSL=true NÃO VERIFICADO) |
| H-029 | MÉDIO | Segurança e integração | `backend/src/app.js:23-28` | **DECISÃO D4.** Problema conhecido 1, hipótese de CORS refutada: `FRONT_ORIGIN` não tem efeito e qualquer origem é aceita com credenciais. | Recusar origem fora da lista e aplicar `trim` em app.js:18. | P | corretor-backend | D4 | CORRIGIDO (revisor: CONFIRMADO) |
| H-030 | MÉDIO | Front dados | `frontend/vite.config.js:11-18` | **DECISÃO D4.** Problema conhecido 1, causa da segunda porta: sem `strictPort`, o Vite sobe em 5174 quando 5173 está ocupada. | Definir `server: { port: 5173, strictPort: true }`. | P | corretor-front-dados | D4 | CORRIGIDO (revisor: CONFIRMADO) |
| H-031 | MÉDIO | Backend público | `backend/src/queries/produtosQueries.js:39-41` | Paginação não inteira, valores gigantes e byte NUL geram 500 em vez de 400. | Validar inteiros seguros e rejeitar `\0`. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-032 | MÉDIO | Backend público | `backend/src/queries/produtosQueries.js:64-72` | Filtros inválidos falham em silêncio e de forma incoerente. | Responder 400 para valor inválido. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-033 | MÉDIO | Backend público | `backend/src/queries/produtosQueries.js:51-57` | A busca não trata acento, espaços nem múltiplas palavras. | Aplicar `trim`, separar termos e normalizar acentos. | M | corretor-backend | — | ABERTO |
| H-034 | MÉDIO | Backend público | `backend/src/queries/produtosQueries.js:77-112`<br>`frontend/src/pages/Home/Home.jsx:90-92` | **DECISÃO D11.** "Ver catálogo completo" leva a `ordenar=novidades`, que mostra 1 SKU por categoria e não existe no seletor. | Apontar o link para `recentes` e aplicar o padrão 8 da D-25. | P | corretor-backend + corretor-front-ui | D11 | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-035 | MÉDIO | Backend público | `backend/src/queries/produtosQueries.js:122-124`<br>`frontend/src/pages/Catalogo/CatalogoHeader.jsx:9` | **DECISÃO D11.** "Melhor avaliados" ordena por popularidade, sem avaliação real. | Remover a opção ou renomeá-la. | P | corretor-front-ui | D11 | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-036 | MÉDIO | Backend público | `backend/src/db.js:10-14` | Pool sem listener `error` e sem timeouts. | Adicionar `pool.on("error")` e timeouts. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-037 | MÉDIO | Backend privado | `backend/src/queries/carrinhoQueries.js:32,41-47` | `PUT /api/carrinho` com `{}` ou `itens` inválido apaga o carrinho e responde sucesso. | Responder 400 se `itens` não for array. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-038 | MÉDIO | Backend privado | `backend/src/queries/carrinhoQueries.js:79-113` | Dois primeiros PUTs simultâneos podem violar o índice único do carrinho ativo. | Usar `ON CONFLICT` ou trava por usuário. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-039 | MÉDIO | Backend privado | `backend/src/queries/pedidosQueries.js:183-204` | Cancelamento sem transação: SELECT e UPDATE separados, e o UPDATE filtra só por `id`. | UPDATE único com `id`, `usuario_id` e `status`. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-040 | MÉDIO | Backend privado | `backend/src/routes/enderecos.js:42,70`<br>`backend/src/routes/pedidos.js:21`<br>`backend/src/queries/pedidosQueries.js:69`<br>`backend/src/queries/carrinhoQueries.js:50` | IDs e itens malformados devem gerar 500 em vez de 400 ou 404. | Validar com `Number.isSafeInteger`. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-041 | MÉDIO | Backend privado | `backend/src/queries/enderecosQueries.js:80-94` | Criações simultâneas podem gerar dois endereços padrão. | Índice único parcial por usuário. | M | corretor-backend + corretor-banco-contratos | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-042 | MÉDIO | Backend privado | `backend/src/queries/enderecosQueries.js:23-58`<br>`backend/src/routes/usuarios.js:21-25` | Validação fraca de endereço e perfil: tamanho, UF, telefone e tipos. | Validar após `trim` e responder 400. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-043 | MÉDIO | Backend privado | `backend/src/app.js:66` | O handler registra o erro inteiro; em JSON malformado ele carrega o corpo bruto, que pode ter dados pessoais. | Registrar só tipo, código e mensagem. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-044 | MÉDIO | Backend privado | `backend/src/queries/carrinhoQueries.js:19`<br>`backend/src/queries/pedidosQueries.js:103-110` | **DECISÃO D7.** A cesta exibe o preço gravado, mas a finalização cobra o preço atual, sem aviso. | Aplicar a regra escolhida na decisão. | M | corretor-backend | D7 | CORRIGIDO (revisor: CONFIRMADO) |
| H-045 | MÉDIO | Backend privado | `backend/db/init.sql:94`<br>`backend/src/queries/pedidosQueries.js:155` | **DECISÃO D8.** O pedido não guarda cópia do endereço: editar ou excluir altera o histórico. | Gravar uma cópia ao finalizar. | M | corretor-banco-contratos + corretor-backend | D8 | ADIADO (D8, D9 ou D10) |
| H-046 | MÉDIO | Backend privado | `backend/src/queries/usuariosQueries.js:44` | O telefone não pode ser apagado: string vazia mantém o valor anterior, e o front mostra sucesso. | Atualizar quando o campo vier definido. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-047 | MÉDIO | Banco e contratos | `backend/src/queries/integracaoQueries.js:38-40,45-46` | **DECISÃO D9.** Na API de integração, `>=` repete a última linha, e a paginação não avança se `limite` linhas tiverem o mesmo `updated_at`. | Usar cursor `(updated_at, id)`. | M | corretor-banco-contratos | D9 | ADIADO (D8, D9 ou D10) |
| H-048 | MÉDIO | Banco e contratos | `backend/scripts/seed-simulado.js:11-13` | `npm run seed:simulado` deve falhar: usa `require` em pacote ESM. | Converter para `import` ou renomear para `.cjs`. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-049 | MÉDIO | Banco e contratos | `backend/src/queries/integracaoQueries.js:24` | O CSV não coloca aspas em campo com `\r` isolado. | Testar com `/[",\r\n]/`. | P | corretor-banco-contratos | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-050 | MÉDIO | Banco e contratos | `backend/src/routes/integracao.js:52-56`<br>`backend/src/queries/integracaoQueries.js:35` | `desde` inválido e `limite=1.5` não são validados. | Validar e responder 400. | P | corretor-banco-contratos | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-051 | MÉDIO | Banco e contratos | `backend/db/init_analytics.sql:1` | **DECISÃO D12.** Schema paralelo divergente e sem uso. | Remover ou arquivar. | P | corretor-banco-contratos | D12 | CORRIGIDO (revisor: CONFIRMADO) |
| H-052 | MÉDIO | Banco e contratos | `backend/db/init.sql:24,96-98,121,143-144` | Faltam CHECKs de valores monetários, quantidade em eventos e coerência entre status e datas. | Adicionar como `NOT VALID` e validar depois. | M | corretor-banco-contratos | H-021 | ABERTO |
| H-053 | MÉDIO | Segurança e integração | `backend/exports/ (7 arquivos)`<br>`backend/.gitignore:2` | Exports de homologação estão versionados apesar de ignorados. | Caio tira do índice com `git rm -r --cached backend/exports`. | P | Caio | — | ABERTO (ação do Caio) |
| H-054 | MÉDIO | Banco e contratos | `docs/API.md:6,12,35-36,51-52,61,63-65,80` | `docs/API.md` diverge do código em formatos, campos e status HTTP. | Atualizar depois das mudanças de contrato. | P | corretor-banco-contratos | H-023, H-014 | CORRIGIDO (revisor: CONFIRMADO) |
| H-055 | MÉDIO | Front dados | `frontend/src/services/api.js:159-169` | O evento de sessão expirada não tem ouvinte, e um 401 sem JSON nem chega a dispará-lo. | Ouvir no AuthProvider e disparar antes do retorno por corpo inválido. | P | corretor-front-dados | — | ABERTO |
| H-056 | MÉDIO | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:44-46`<br>`frontend/src/context/FavoritosContextProvider.jsx:30-32`<br>`frontend/src/hooks/usePerfil.js:30-32` | Ao sair, o estado não é limpo, e o próximo usuário pode herdar a cesta anterior. | Limpar o estado quando o `uid` mudar. | P | corretor-front-dados | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-057 | MÉDIO | Front dados | `frontend/src/context/CarrinhoContextProvider.jsx:81-119`<br>`frontend/src/context/FavoritosContextProvider.jsx:77-81` | Cliques rápidos usam estado antigo, e respostas fora de ordem desfazem alterações. | Enfileirar mutações. | M | corretor-front-dados | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-058 | MÉDIO | Front UI | `frontend/src/pages/Carrinho/Carrinho.jsx:88,102`<br>`frontend/src/components/AddressCard/AddressCard.jsx:40,94`<br>`frontend/src/components/OrderCard/OrderCard.jsx:63`<br>`frontend/src/components/ProductCard/ProductCard.jsx:51`<br>`frontend/src/pages/Produto/Produto.jsx:178`<br>`frontend/src/pages/Favoritos/Favoritos.jsx:120` | Ações assíncronas sem `catch` geram rejeição não tratada. | Capturar e exibir mensagem. | M | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-059 | MÉDIO | Front dados | `frontend/src/hooks/useProduto.js:22-48`<br>`frontend/src/hooks/useProdutos.js:47-91`<br>`frontend/src/pages/Produto/Produto.jsx:61-62` | Ao trocar de produto ou filtro, erro, dados e cor escolhida anteriores permanecem. | Usar `key={id}` e limpar o erro a cada busca. | P | corretor-front-dados | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-060 | MÉDIO | Front UI | `frontend/src/pages/Perfil/Perfil.jsx:51-59,135`<br>`frontend/src/pages/Perfil/PerfilDadosSection.jsx:26` | O telefone salvo pode aparecer vazio no formulário. | Incluir o telefone na `key` ou montar o formulário após carregar. | P | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-061 | MÉDIO | Front UI | `frontend/src/components/Pagination/Pagination.jsx:19`<br>`frontend/src/components/Pagination/Pagination.module.css:1-18` | A paginação lista todas as 17 páginas sem quebra de linha e deve estourar a largura. | Janela de páginas com reticências e `flex-wrap`. | M | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-062 | MÉDIO | Front UI | `frontend/src/components/Header/Header.module.css:13-25,34-37,103-107` | O header deve estourar em 390 px. | Reduzir a logo e mover o tema para o menu. | M | corretor-front-ui | — | ABERTO |
| H-063 | MÉDIO | Front UI | `frontend/src/components/Layout/Layout.jsx:26`<br>`frontend/src/pages/Favoritos/Favoritos.jsx:162`<br>`frontend/src/pages/Home/Home.jsx:62` | `<main>` dentro de `<main>` e margem lateral dobrada. | Manter um único `main`. | M | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-064 | MÉDIO | Front UI | `frontend/src/pages/Produto/Produto.jsx:133-136` | Roupa infantil aparece como "Número (calçado)". | Decidir pela categoria Calçados. | P | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-065 | MÉDIO | Front UI | `frontend/src/pages/Produto/Produto.jsx:228-229,256,300` | O resumo de avaliações nunca aparece. | Usar `avaliacoes.resumo`. | P | corretor-front-ui | — | ABERTO (nenhum defeito identificado no front; a rota de avaliações devolve resumo zerado) |
| H-066 | MÉDIO | Front UI | `frontend/src/pages/Home/Home.jsx:85-87,126`<br>`frontend/src/pages/Produto/ProductAccordions.jsx:14,20-21` | **DECISÃO D11.** Novidades e descrições sem rótulo SIMULADO, e o texto promete envio ao Brasil todo. | Rotular e ajustar o texto. | P | corretor-front-ui | D11 | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-067 | MÉDIO | Front UI | `frontend/src/components/CartItem/CartItem.jsx:66`<br>`frontend/src/components/OrderCard/OrderCard.jsx:134` | Produto sem cor ou tamanho mostra rótulo vazio. | Exibir só atributos preenchidos. | P | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-068 | MÉDIO | Front UI | `frontend/src/components/OrderCard/OrderCard.jsx:98` | Chave React duplicada com duas variantes do mesmo SKU. | Incluir tamanho e cor. | P | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-069 | MÉDIO | Front UI | `frontend/src/pages/Produto/ProductColorSelector.jsx:27`<br>`frontend/src/pages/Produto/ProductSizeSelector.jsx:43`<br>`frontend/src/components/PaymentOptions/PaymentOptions.jsx:34` | Grupos de opção com semântica errada ou sem nome. | Usar `fieldset` e `legend`. | M | corretor-front-ui | — | PARCIAL (só PaymentOptions; demais grupos pendentes) |
| H-070 | MÉDIO | Front UI | `frontend/src/components/ChatWidget/ChatWidget.module.css:42-45` | Foco invisível no botão do chat. | Contorno `--color-ink` e devolver o foco ao fechar. | P | corretor-front-ui | — | ABERTO |
| H-071 | MÉDIO | Front UI | `frontend/src/components/FilterPanel/FilterPanel.jsx:62-65` | Filtro fechado no mobile continua recebendo foco por Tab. | Aplicar `inert` e comportamento de diálogo. | M | corretor-front-ui | — | ABERTO |
| H-072 | MÉDIO | Front UI | `frontend/src/components/Header/Header.module.css:94,100` | Texto secundário reprova AA no tema claro. | Escurecer o token. | P | corretor-front-ui | — | ABERTO |
| H-073 | MÉDIO | Front UI | `frontend/src/pages/Login/LoginBanner.jsx:10,12` | Link focável dentro de `aria-hidden="true"`. | Tirar o `aria-hidden` ou o link. | P | corretor-front-ui | — | ABERTO |
| H-074 | MÉDIO | Front UI | `frontend/src/pages/Login/Login.module.css:160` | Campo de senha sem borda visível. | Usar a mesma borda do e-mail. | P | corretor-front-ui | — | ABERTO |
| H-075 | MÉDIO | Front UI | `frontend/src/pages/Home/HomeHero.jsx:26-31`<br>`frontend/src/pages/Home/EditorialBanner.jsx:17-22` | Botão dentro de link: HTML inválido. | Estilizar o Link como botão. | P | corretor-front-ui | — | ABERTO |
| H-076 | MÉDIO | Front UI | `frontend/src/components/ui/QuantityStepper/QuantityStepper.module.css:17-20` | Alvos de toque abaixo de 44 px. | Ampliar a área clicável. | P | corretor-front-ui | — | ABERTO |
| H-077 | MÉDIO | Front dados | `frontend/src/hooks/useProdutos.js:47-69`<br>`frontend/src/components/FilterPanel/FilterPanel.jsx:125,133` | Ao filtrar não há indicação de carga, e cada dígito do preço dispara uma busca. | Indicar atualização e aplicar debounce no preço. | M | corretor-front-dados | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-078 | MÉDIO | Front UI | `frontend/src/pages/Catalogo/Catalogo.jsx:132-139,204-205` | "Limpar filtros" não faz nada quando o vazio vem da busca. | Limpar também a busca na tela vazia. | P | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-079 | MÉDIO | Segurança e integração | `backend/src/app.js:21-39` | **DECISÃO D13.** Sem rate limit global e sem `trust proxy`. | Limitar por IP e ajustar `trust proxy`. | M | corretor-backend | D13 | CORRIGIDO (revisor: CONFIRMADO) |
| H-080 | MÉDIO | Segurança e integração | `backend/src/app.js:15` | Sem headers de segurança, e `X-Powered-By` segue ativo. | Desativar `x-powered-by` e definir headers básicos. | P | corretor-backend | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-081 | MÉDIO | Segurança e integração | `backend/docker-compose.yml:7,10` | Postgres publicado em todas as interfaces, com senha padrão como fallback. | Publicar em `127.0.0.1:5432:5432`. | P | Caio | — | PARCIAL (arquivo CONFIRMADO; contêiner ainda em 0.0.0.0:5433) |
| H-082 | MÉDIO | Segurança e integração | `.gitignore:44-45` | **DECISÃO D12.** `docs/` está ignorado, mas 14 documentos seguem rastreados. Documentos novos ficam fora do git. | Definir a regra da pasta. | P | Caio | D12 | CORRIGIDO (revisor: CONFIRMADO) |
| H-083 | MÉDIO | Segurança e integração | `.gitignore:19-23` | Faltam padrões para service account, `*.pem` e `*.key`. | Acrescentar os padrões. | P | Caio | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-084 | MÉDIO | Segurança e integração | `frontend/package.json:13` | `npm audit --omit=dev`: 4 altas no frontend e 4 na raiz (`@grpc/grpc-js`); backend sem achados. | Não usar `audit fix --force`; acompanhar nova versão. | P | Caio | — | ABERTO |
| H-085 | MÉDIO | Segurança e integração | `docs/STATUS.md:7,11-12,73,125`<br>`docs/PROJECT.md:15,38` | Documentação desatualizada, incluindo a afirmação de testes em 390/768/1440 (problema conhecido 7). | Atualizar STATUS, PROJECT e README. | M | Caio | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-086 | BAIXO | Backend público | `backend/src/routes/health.js:5-7` | O health responde `ok` sem consultar o banco. | Executar `SELECT 1`. | P | corretor-backend | — | ABERTO |
| H-087 | BAIXO | Backend público | `backend/src/app.js:68-73` | Erros 4xx expõem mensagens internas em inglês. | Mapear para mensagens em português. | P | corretor-backend | — | ABERTO |
| H-088 | BAIXO | Backend público | `backend/src/queries/produtosQueries.js:52` | `%` e `_` na busca funcionam como curingas. | Escapar os curingas. | P | corretor-backend | — | ABERTO |
| H-089 | BAIXO | Backend público | `backend/src/queries/produtosQueries.js:6-19` | **DECISÃO D12.** O campo `imagens` do checklist não existe na API. | Registrar no contrato ou devolver o campo. | P | corretor-backend | D12 | ABERTO |
| H-090 | BAIXO | Backend público | `backend/scripts/seed-catalogo.js:63` | Cor desconhecida vira marrom sem aviso. | Abortar ou registrar aviso. | P | corretor-backend | — | ABERTO |
| H-091 | BAIXO | Backend privado | `backend/src/services/analyticsService.js:7,42,77` | Coleções em memória crescem sem limite, e o token é verificado duas vezes. | Limitar as coleções e reaproveitar o token. | M | corretor-backend | — | ABERTO |
| H-092 | BAIXO | Backend público | `backend/db/init.sql:34-36` | Sem índice para preço, tamanhos ou busca textual. | Reavaliar se o catálogo crescer. | P | corretor-banco-contratos | — | ABERTO |
| H-093 | BAIXO | Backend privado | `backend/src/queries/carrinhoHelpers.js:37-38` | Quantidade aceita `true` e `[3]`. | Exigir `typeof === "number"`. | P | corretor-backend | — | ABERTO |
| H-094 | BAIXO | Backend privado | `backend/src/routes/chat.js:25,54,65` | `sessaoId` do corpo vai ao ADK sem validação. | Validar a sessão e o tipo da resposta. | P | corretor-backend | — | ABERTO |
| H-095 | BAIXO | Backend privado | `backend/src/queries/carrinhoQueries.js:70`<br>`backend/src/queries/pedidosQueries.js:113` | `FRETE_SIMULADO=0` vira R$ 15,00, e a regra está duplicada. | Criar função única. | P | corretor-backend | — | ABERTO |
| H-096 | BAIXO | Banco e contratos | `backend/db/init.sql:94,118-119,145` | Faltam índices em chaves estrangeiras. | Criar índices. | P | corretor-banco-contratos | H-021 | ABERTO |
| H-097 | BAIXO | Banco e contratos | `backend/db/init.sql:91` | **DECISÃO D12.** `pedidos.usuario_id` não tem FK para `usuarios`. | Aplicar a escolha da decisão. | P | corretor-banco-contratos | D12, H-021 | ABERTO |
| H-098 | BAIXO | Banco e contratos | `backend/src/services/analyticsService.js:45-55` | `session_start` pode duplicar em requisições simultâneas. | Criar índice único parcial. | P | corretor-banco-contratos | H-021 | ABERTO |
| H-099 | BAIXO | Banco e contratos | `backend/scripts/export-novos.js:100-115` | Gera CSV só com cabeçalho e salva a marca apenas no fim. | Pular arquivo vazio e salvar a marca por tipo. | P | corretor-backend | — | ABERTO |
| H-100 | BAIXO | Segurança e integração | `backend/scripts/test-b3b.js:92,105`<br>`backend/exports/` | **DECISÃO D14.** Dados de homologação precisam ser limpos antes da extração. | Classificar os usuários e limpar. | P | Caio | D14 | ABERTO (ação do Caio) |
| H-101 | BAIXO | Front dados | `frontend/vite.config.js:6` | `frontend/.env` não é usado, pois o Vite lê a raiz. | Manter um único `.env`. | P | Caio | — | ABERTO (ação do Caio) |
| H-102 | BAIXO | Front dados | `frontend/src/context/AuthContextProvider.jsx:16-31` | `auth/unauthorized-domain` não tem tradução. | Adicionar a mensagem. | P | corretor-front-dados | — | ABERTO |
| H-103 | BAIXO | Front dados | `frontend/src/api/`<br>`frontend/src/ProductSilhouette/`<br>`frontend/src/hooks/index.js` | **DECISÃO D12.** Código sem uso e pasta duplicada. | Remover, com aval do Caio. | P | corretor-front-dados | D12 | CORRIGIDO (revisor: CONFIRMADO) |
| H-104 | BAIXO | Front dados | `frontend/src/services/api.js:3` | Import dinâmico sem efeito e bundle JS de 541,58 kB. | Usar import estático. | P | corretor-front-dados | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-105 | BAIXO | Front dados | `frontend/src/services/mapeadores.js:51-55,167,208,263` | Resposta 200 com formato inesperado vira lista vazia. | Lançar erro de formato. | P | corretor-front-dados | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-106 | BAIXO | Front dados | `frontend/src/pages/Produto/Produto.jsx:196-201` | Item novo aparece por instantes com nome vazio e preço 0. | Enviar nome e preço. | P | corretor-front-ui | — | ABERTO |
| H-107 | BAIXO | Front dados | `frontend/src/hooks/useProdutos.js:31-39` | O debounce de 300 ms só atrasa a busca. | Remover o debounce. | P | corretor-front-dados | — | ABERTO |
| H-108 | BAIXO | Front UI | `frontend/src/components/ui/ProductImage/ProductImage.module.css:34` | Cores claras somem no tema claro e escuras no tema escuro. | Reforçar o contorno. | P | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-109 | BAIXO | Front UI | `frontend/src/components/ChatWidget/ChatWidget.module.css:23-141` | Desvios das regras de estilo: `!important`, `rgba` soltos e um hex no JSX. | Criar tokens e remover os desvios. | M | corretor-front-ui | — | ABERTO |
| H-110 | BAIXO | Front UI | `frontend/src/components/ProductSilhouette/ProductSilhouette.jsx:9,16` | A cor entra sem validação em `dangerouslySetInnerHTML`. | Aceitar só `#RRGGBB`. | P | corretor-front-ui | H-015 | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-111 | BAIXO | Front UI | `frontend/src/pages/Perfil/PerfilEnderecosSection.jsx:41-46` | Endereço salvo sem mensagem de sucesso. | Adicionar a mensagem. | P | corretor-front-ui | — | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-112 | BAIXO | Front UI | `docs/DESIGN.md:65,113,134,172`<br>`frontend/src/pages/Termos/Termos.jsx:28-29` | Documentos citam boleto e divergem do código. | Atualizar após a decisão de pagamento. | P | corretor-front-ui | H-024 | CORRIGIDO (revisor: CONFIRMADO) |
| H-113 | BAIXO | QA | `backend/package.json:7-13`<br>`frontend/package.json:6-11` | Não há script `test` nem arquivos de teste automatizado. | Avaliar teste mínimo do contrato dos hooks. | M | corretor-front-dados | — | ABERTO |
| H-114 | BAIXO | Segurança e integração | `backend/.env.example:8,21,26` | O exemplo traz valores e não lista `NODE_ENV` nem `DATABASE_SSL`. | Deixar valores vazios e acrescentar as variáveis. | P | Caio | — | CORRIGIDO (revisor: CONFIRMADO) |
| H-115 | BAIXO | Segurança e integração | `backend/db/init.sql:155,173` | `usuario_hash` é SHA-256 truncado sem salt. | Usar salt, se o contrato permitir. | M | corretor-banco-contratos | H-020 | ABERTO |
| H-116 | BAIXO | Segurança e integração | `package.json:2-7` | Dependências na raiz, incluindo `axios`, vedado pela decisão do projeto. | Remover se confirmado sem uso. | P | Caio | — | ABERTO |

## Decisões

| ID | Tema | O que decidir |
|---|---|---|
| D1 | Pagamento | Definir os valores (sugestão: `PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO`), o máximo de parcelas e o destino dos pedidos antigos com `CARTAO` ou `BOLETO`. Revisa a D-12 e precisa ser alinhado com o Diego. |
| D2 | Chave publicada | Confirmar se o valor é a chave em uso e trocá-la. Reescrever o histórico de `origin/dev` é opcional e afeta o grupo; a recomendação é só trocar. |
| D3 | Bypass de teste | Remover os tokens `test:` e `mock:` (recomendado) ou mantê-los atrás de uma flag desligada por padrão. |
| D4 | Portas e origens | Manter só a 5173 (recomendado) ou autorizar também a 5174, e informar a URL de produção. |
| D5 | `corHex` na API | Aprovar o campo novo no contrato público (recomendado) em vez de buscar cada produto no front. |
| D6 | Chat | Conectar agora ou ocultar o widget até o ADK estar disponível. |
| D7 | Mudança de preço | Atualizar em silêncio, avisar o cliente ou bloquear com 409 quando o preço mudar entre a cesta e a finalização. |
| D8 | Endereço no pedido | Guardar cópia completa ou só cidade e UF. |
| D9 | Pipeline | Com o Diego: fornecer o contrato, aceitar entrega "pelo menos uma vez" com deduplicação e definir o `valor` dos eventos (`begin_checkout` usa subtotal, `purchase` usa total com frete). |
| D10 | Carrinhos e avaliações no BI | Definir de onde sai o abandono de carrinho e se o contrato exige o CSV de `avaliacoes`. |
| D11 | Textos de vitrine | Definir o destino do link de novidades, o futuro de "Melhor avaliados" e o texto do rótulo SIMULADO. |
| D12 | Organização do repositório | Definir se `docs/` é versionada, se `init_analytics.sql` e o código morto saem, se `pedidos.usuario_id` ganha FK e se `imagens` entra na API. |
| D13 | Rate limit | Adotar `express-rate-limit` (biblioteca nova, exige aval) ou implementação própria. |
| D14 | Limpeza de dados | Indicar quais usuários são reais e quais contas de teste saem do banco e do Firebase. |
| D15 | Prazo de cancelamento | Hoje qualquer pedido finalizado pode ser cancelado a qualquer momento. Confirmar se a regra fica assim. |

## Fase 1: banco e backend (2026-11-18)

- **Resultado:** 29 corrigidos, 4 parciais e 4 adiados. O revisor não reprovou nenhum dos 33 itens conferidos.
- **Testes:** 109 verificações aprovadas em Postgres descartável, já removido. Nenhum dado de teste ficou no banco local.
- **Banco local:** 5 migrações aplicadas. Os 7 pedidos existentes receberam `parcelas = 1`.

| ID | Gravidade | Arquivo:linha | Pendência da revisão | Status |
|---|---|---|---|---|
| RV-001 | ALTO | `frontend/src/components/PaymentOptions/PaymentOptions.jsx:11,16` | O front ainda envia CARTAO e BOLETO, e a API responde 400. Só PIX finaliza até H-024. | ABERTO (Fases 2 e 3) |
| RV-002 | MÉDIO | `backend/db/migrations/005_pagamento_parcelas_endereco_padrao.sql:52` | A 005 falha se outro banco tiver endereços padrão duplicados. No banco local já foi aplicada. | ABERTO |
| RV-003 | BAIXO | `backend/src/queries/usuariosQueries.js:61` | O regex do telefone aceita quebra de linha e tabulação. | ABERTO |
| RV-004 | BAIXO | `backend/src/queries/carrinhoHelpers.js:4-5` | Escapes unicode viraram caracteres literais. | ABERTO |
| RV-005 | BAIXO | `backend/src/services/analyticsService.js:72` | Falha ao gravar begin_checkout é ignorada e a rota responde 204. | ABERTO |

## Fase 2: camada de dados do front (2026-11-18)

- **Resultado:** 10 corrigidos e 7 parciais. H-009 foi reprovado na primeira revisão por causa de favoritos, corrigido na rodada 2 e confirmado.
- **Verificação:** lint e build aprovados. Nada foi testado no navegador.

**Pedidos para o corretor-front-ui (Fase 3):**

1. `PaymentOptions.jsx:4-20`: usar PIX, CARTAO_CREDITO e CARTAO_DEBITO.
2. `CartItem.jsx:37,43`: enviar o item inteiro em `onAlterarQuantidade` e `onRemover`.
3. `Carrinho.jsx:82-103`: passar tamanho e cor ao provider e tratar a rejeição.
4. `Checkout.jsx`: chamar `useCheckoutIniciado()` antes dos returns antecipados.
5. `Checkout.jsx:183`: enviar `parcelas` no crédito. O bloco de erro em 104-126 não pode esconder a confirmação do pedido.
6. Carrinho, Produto e Favoritos: exibir `erroAcao` com `limparErroAcao()`; usar `cestaPronta` e `favoritosProntos`.
7. `Catalogo.jsx:150-169`: manter o FilterPanel montado e usar `atualizando`.
8. `Catalogo.jsx:158-168`: em erro 400, mostrar a mensagem e oferecer "Limpar filtros".
9. `Produto.jsx`: aplicar `key={id}`.
10. H-003, H-004 e H-005: usar `favoritos`, `salvar`, `criar`, `editar` e `excluir`; `usePerfil()` expõe `salvando`.

## Fase 3: telas do front (2026-11-18)

- **Resultado:** 26 corrigidos, 1 parcial e 1 encerrado. O revisor não reprovou nenhum item.
- **QA:** lint, build, GET da API, 401 sem token, CORS e proxy do Vite aprovados. Fluxos de tela ficam para o teste manual do Caio.
- **Não feitos:** H-062, H-065, H-070 a H-076 e o restante de H-069.

| ID | Gravidade | Arquivo:linha | Pendência da revisão | Status |
|---|---|---|---|---|
| RV-F3-001 | BAIXO | `frontend/src/pages/Termos/Termos.jsx:28-29` | O texto ainda cita boleto. Coberto por H-112 na Fase 4. | ABERTO |
| RV-F3-002 | BAIXO | `frontend/src/components/Header/Header.jsx:20` | O termo de busca continua no cabeçalho depois de limpar os filtros. | ABERTO |
| RV-F3-003 | BAIXO | `frontend/src/context/CarrinhoContextProvider.jsx:50` | `erroAcao` é global e pode reaparecer em outra página. O mesmo vale para favoritos. | ABERTO |

## Fase 4: docs e higiene (2026-11-18)

- **Resultado:** 6 itens corrigidos e confirmados pelo revisor (H-051, H-054, H-082, H-085, H-103 e H-112), além da revisão da D-12.
- **Removidos em H-103:** 6 arquivos de `frontend/src/api/` e `frontend/src/ProductSilhouette/`, sem nenhum importador.

| ID | Gravidade | Arquivo:linha | Pendência da revisão | Status |
|---|---|---|---|---|
| RV-F4-001 | BAIXO | `docs/API.md:3,110` | O texto ainda chama o contrato de provisório e cita `src/api/`. | ABERTO |
| RV-F4-002 | BAIXO | `frontend/src/AGENTS.md:48,69,84` | A regra ainda aponta `src/api/`; a camada atual é `src/services/`. | ABERTO |
| RV-F4-003 | BAIXO | `docs/relatorios/relatorio18-11-2026-consolidado.md:40` | Relatórios têm caminhos locais `file:///`. O Caio decide se entram no git. | ABERTO |
