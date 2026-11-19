# Relatório Geral de Revisão e Evolução — Integração de Dados, Back-end B3b e Qualidade

**Data:** 18/11/2026  
**Projeto:** Lojas Horizonte (`projeto-lojas-horizonte-g1`)  
**Agente:** Revisor (`reviewer`)  
**Branch:** `dev`  
**Commit Base Anterior:** `c12af20` (referenciado em `relatorio17-11-2026-consolidado.md`)  
**Commit HEAD Atual:** `3662e80` (+ alterações de trabalho de B3b-fix)  
**Status de Qualidade:** 100% aprovado no Lint e Build do frontend; 100% dos testes e scripts do backend aprovados  

---

## 1. Resumo Executivo

Este relatório consolida a auditoria completa de evolução técnica e qualidade do projeto **Lojas Horizonte** no dia **18/11/2026**, cobrindo todas as entregas realizadas a partir do último relatório consolidado (`relatorio17-11-2026-consolidado.md`, commit `c12af20`). O projeto unificou com sucesso as branches de desenvolvimento na branch `dev`, entregou o back-end das tarefas B2, B3a, B3b e B3b-fix (autenticação Firebase, rotas privadas, carrinho, cancelamento, exportações incrementais de BI e cálculo de datas em `America/Sao_Paulo`), implantou as silhuetas de produto em SVG e conectou a camada de dados real (Tarefa 4A) nas telas de Home, Catálogo e Produto. Não foram encontrados bloqueios críticos de compilação ou segurança estrutural; os apontamentos concentram-se na limpeza de código duplicado e na formalização de contratos.

---

## 2. O que Mudou Desde o Último Relatório

No último relatório (`relatorio17-11-2026-consolidado.md`), a base do front-end estava finalizada com dados locais por props (Fase 3), e o back-end havia entregue apenas a infraestrutura inicial e o catálogo da Tarefa B1.

Desde então, o `git log --oneline c12af20..HEAD` registrou **11 commits** cruciais:
- `2f8ee3d`: *feat(backend): implementa auth firebase, rotas privadas de perfil, enderecos, favoritos e novidades por categoria (tarefa b2)*
- `f47ce86`: *feat(backend): carrinho, finalizacao e cancelamento de pedidos e funil de eventos (B3a)*
- `98c9719`: *feat(backend): implementa rotas de integracao bi, exportacao incremental e proxy resiliente de chat (tarefa b3b)*
- `7d91922`: *commit teste*
- `aecc6bc` e `77bccdf`: *feat(frontend): adiciona silhuetas de produto em SVG por tipo de peça e tingimento dinâmico*
- `0385009`: *chore: unifica frontend e backend na dev*
- `952479a`: *feat(dev): implementa servicos de produtos, mapeadores e hooks de dados da api real (tarefa 4A)*
- `94d6cbb`: *feat(ui): conecta Catalogo, Produto e Home aos hooks da API real (tarefa 4A)*
- `a638857`: *refactor: api.js refatorado*
- `3662e80`: *fix(dev): adiciona proxy /api no vite, blinda apiFetch contra respostas nao-json e corrige prop do accordion*
- **Alterações locais de trabalho (B3b-fix)**: fuso `America/Sao_Paulo` nas datas exibidas pelo front, garantia de criação do usuário no primeiro acesso em `requireAuth`, e atualização de perfil não-destrutiva.

### 2.1. Entregas por Área

#### A. Back-end
1. **Autenticação Firebase & Rotas Privadas (B2):**
   - Middleware `requireAuth` ([backend/src/middlewares/auth.js](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/backend/src/middlewares/auth.js)) validando tokens Firebase (`verifyIdToken`).
   - Rotas de Perfil (`/api/usuarios/perfil` GET e PUT), Endereços (`/api/enderecos` CRUD) e Favoritos (`/api/favoritos` GET, PUT, DELETE).
2. **Carrinho, Pedidos e Analytics (B3a):**
   - Rotas `/api/carrinho` (GET, PUT) e `/api/carrinho/finalizar` (POST) com cálculo estrito no servidor, validação de tamanhos e transações `BEGIN`/`COMMIT`/`ROLLBACK`.
   - Rotas `/api/pedidos/meus` (GET) e `/api/pedidos/:id/cancelar` (POST).
   - Middleware `analyticsMiddleware` append-only gravando eventos em `loja.analytics_eventos` via cabeçalho `X-Sessao-Id` (D-23).
3. **Integração BI e Proxy de Chat (B3b):**
   - Endpoints `/api/integracao/pedidos`, `/api/integracao/pedido-itens` e `/api/integracao/eventos` protegidos por API Key com `crypto.timingSafeEqual`, suporte a JSON e CSV, paginação por cursor `desde` e limite configurável.
   - Script CLI incremental `backend/scripts/export-novos.js` com controle de cursor em `.marca.json`.
   - Rota `/api/chat` com rate limiting (20 msg/min por usuário), validação de tamanho (1 a 1000 caracteres), timeout de 20s e fallback 503 quando indisponível.
4. **Ajustes B3b-fix:**
   - Padronização de datas para o front no fuso `America/Sao_Paulo` (campo `dataLocal` ex.: `"2026-11-18T11:03:16-03:00"`) via módulo utilitário [backend/src/utils/datas.js](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/backend/src/utils/datas.js). Os exports de integração permanecem em UTC com sufixo `Z`.
   - Garantia de registro de usuário em `requireAuth` no primeiro acesso via `INSERT INTO loja.usuarios (usuario_id, email, nome) VALUES ($1, $2, $3) ON CONFLICT (usuario_id) DO NOTHING` com cache em `Set` em memória.
   - Atualização não-destrutiva de perfil no `PUT /api/usuarios/perfil` (preserva nome e telefone existentes quando não fornecidos).

#### B. Front-end
1. **Silhuetas SVG de Produto (D-14 e D-24):**
   - Integração de silhuetas SVG monocromáticas por tipo de peça (camisa, calça, vestido, calçado, bolsa, etc.) em [ProductSilhouette](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/components/ProductSilhouette/ProductSilhouette.jsx).
   - [ProductImage](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/components/ui/ProductImage/ProductImage.jsx) renderiza silhueta tingida pela cor do produto (`cores[0].hex`) com fundo semântico e proporção 4:5, mantendo ícones Lucide como fallback.
2. **Camada de Dados da API Real (Tarefa 4A Dados):**
   - [services/api.js](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/services/api.js): fetch nativo, injeção de `Bearer <idToken>` e `X-Sessao-Id`, tratamento de `NetworkError` distinguível e `ApiError`.
   - [services/produtosService.js](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/services/produtosService.js) e [services/mapeadores.js](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/services/mapeadores.js): normalização central de produtos, listas, categorias e avaliações.
   - Hooks [useCategorias](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/hooks/useCategorias.js), [useProdutos](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/hooks/useProdutos.js) (debounce de 300ms na busca), [useNovidades](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/hooks/useNovidades.js), [useProduto](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/hooks/useProduto.js), [useSemelhantes](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/hooks/useSemelhantes.js) e [useAvaliacoes](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/hooks/useAvaliacoes.js), todos com `AbortController`.
3. **Conexão das Telas (Tarefa 4A UI):**
   - **Catálogo (`/catalogo`)**: filtros sincronizados com URL (`useSearchParams`), paginação real, estados estritos de carregando (skeleton), erro ("Tentar de novo") e vazio (apenas lista vazia).
   - **Home (`/`)**: seção `#novidades` com 8 produtos reais de categorias distintas (D-25) com selo "Novo".
   - **Produto (`/produto/:id`)**: dados reais, SKU na rota, auto-seleção de tamanho único, ocultação de seletor de cor se vazio, e 404 transformado em EmptyState com link para catálogo.
4. **Correção de Proxy e Blindagem (Fix 4A):**
   - Configuração de proxy `/api` -> `http://localhost:3000` em [vite.config.js](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/vite.config.js).
   - Blindagem em `apiFetch` para rejeitar respostas HTML inválidas (evitando falsos estados vazios).
   - Correção do aviso React `defaultOpen` no componente [Accordion.jsx](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/components/ui/Accordion/Accordion.jsx).

#### C. Banco de Dados e Documentação
- Esquema `loja` totalmente populado e auditado (tabelas `produtos`, `usuarios`, `enderecos`, `favoritos`, `pedidos`, `pedido_itens`, `analytics_eventos` e views de exportação).
- Atualização e alinhamento em `docs/API.md` e `docs/DECISIONS.md`.

---

## 3. Achados por Gravidade

### Crítico
*Nenhum achado crítico identificado.*

---

### Alto
*Nenhum achado de alta gravidade identificado.*

---

### Médio

1. **CORS permissivo em modo de desenvolvimento sem guarda de produção**
   - **Arquivo / Linha:** [backend/src/app.js:27](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/backend/src/app.js#L27)
   - **Problema:** A função callback de validação de origem do CORS retorna `callback(null, true)` mesmo se a origem não constar no conjunto `origensPermitidas`.
   - **Correção sugerida:** Rejeitar origens não mapeadas quando `process.env.NODE_ENV === 'production'`:
     ```javascript
     if (!origem || origensPermitidas.has(origem)) {
       return callback(null, true);
     }
     if (process.env.NODE_ENV !== "production") {
       return callback(null, true);
     }
     return callback(new Error("Origem não permitida pelo CORS"));
     ```

2. **Diretório duplicado e código morto de silhuetas de produtos**
   - **Arquivo / Linha:** [frontend/src/ProductSilhouette/](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/ProductSilhouette) (arquivos `formas.js`, `ProductSilhouette.jsx`, `ProductSilhouette.module.css`, `tipoDaPeca.js`)
   - **Problema:** O diretório oficial consumido por `ProductImage.jsx` é [frontend/src/components/ProductSilhouette/](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/components/ProductSilhouette/ProductSilhouette.jsx). Os arquivos na raiz de `src/` ficaram órfãos após unificação de branches.
   - **Correção sugerida:** Remover com segurança o diretório duplicado `frontend/src/ProductSilhouette/` via `git rm -r frontend/src/ProductSilhouette`.

---

### Baixo

1. **Camada legada `src/api` coabitando com `src/services`**
   - **Arquivo / Linha:** [frontend/src/api/client.js](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/api/client.js) e [frontend/src/api/categorias.js](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/api/categorias.js)
   - **Problema:** Ambos são apenas re-exports finos redirecionando para `@/services/api` e `@/services/produtosService`. Nenhum componente de `src/` importa mais de `@/api`.
   - **Correção sugerida:** Remover a pasta `frontend/src/api/` antes da entrega final da Fase 5 para manter a arquitetura limpa.

2. **Aviso de tamanho de chunk e importação dinâmica no build do Vite**
   - **Arquivo / Linha:** [frontend/src/services/api.js:3](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/frontend/src/services/api.js#L3)
   - **Problema:** `src/firebase.js` é importado dinamicamente em `api.js` (`await import("../firebase.js")`), porém é importado estaticamente em `src/context/AuthContextProvider.jsx`. O compilador emite:
     `[INEFFECTIVE_DYNAMIC_IMPORT] src/firebase.js is dynamically imported by src/services/api.js but also statically imported...`
     Além disso, o bundle gerado ultrapassa 500 kB (`assets/index-mwOL7Srw.js: 525.45 kB`).
   - **Correção sugerida:** Manter importação direta ou refatorar code-splitting na Fase 5 com `React.lazy` nas rotas do `App.jsx`.

3. **Defasagem pontual do arquivo `docs/STATUS.md`**
   - **Arquivo / Linha:** [docs/STATUS.md:9-12](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/docs/STATUS.md#L9-L12)
   - **Problema:** A seção "Bloqueios externos" ainda menciona que "o dataset ainda não chegou" e "o back-end será feito depois do front", enquanto ambos já foram executados e validados.
   - **Correção sugerida:** Atualizar `STATUS.md` refletindo as entregas das Fases B1 a B3b e Tarefa 4A.

---

## 4. Divergências de Contrato e Documentação

1. **`SCHEMA_PIPELINE_v1.md`**:
   - **Status:** Não verificado no disco local. O arquivo não existe no repositório.
   - **Evidência:** `Get-ChildItem -Filter '*SCHEMA*'` retornou 0 arquivos na raiz e em `docs/`.
   - **Alinhamento:** As views de exportação do banco (`loja.vw_export_pedidos`, `loja.vw_export_pedido_itens` e `loja.vw_export_analytics_eventos`) e o endpoint `/api/integracao/*` seguem fielmente as especificações descritas em `docs/API.md` e em `db/init.sql`.

2. **Extensões de datas no contrato de pedidos e perfil**:
   - As rotas `GET /api/usuarios/perfil`, `GET /api/pedidos/meus` e `POST /api/carrinho/finalizar` agora devolvem o campo `dataLocal` formatado no fuso `America/Sao_Paulo` (ex.: `"2026-11-18T11:03:16-03:00"`), além dos campos ISO UTC existentes (`dataIso`, `criadoEm`, `updatedAt`). Essa evolução é retrocompatível, pois não altera o tipo dos campos originais.

---

## 5. Estado dos Testes, Lint e Build

| Escopo | Comando | Resultado | Evidência |
|---|---|---|---|
| **Frontend Lint** | `npm --prefix frontend run lint` | **Aprovado** (0 erros, 0 avisos) | Execução via ESLint flat config sem apontamentos |
| **Frontend Build** | `npm --prefix frontend run build` | **Aprovado** (2283 módulos em 3.73s) | `dist/index.html` (1.33 kB), CSS (91.17 kB), JS (525.45 kB) |
| **Backend B3b-fix Test** | `node scripts/test-b3b.js` | **Aprovado** (5 suítes de validação) | Conta virgem testada com `PUT favoritos` e `POST enderecos`; `dataLocal` em SP; `Z` na integração |
| **Backend Export BI** | `node scripts/export-novos.js` | **Aprovado** | Exportação incremental de pedidos, itens e eventos em CSV com `.marca.json` |
| **Git Status** | `git status -s` | **Limpo / Rastreado** | Apenas as alterações da tarefa B3b-fix presentes na working tree |
| **Segurança de Segredos** | `git ls-files -- "*env*"` | **Aprovado** | Nenhum arquivo `.env` versionado; apenas `.env.example` presente |

---

## 6. Riscos Novos e Riscos que Continuam

### Riscos que Continuam
1. **Prazo de Congelamento de Código (Freeze em 20/11):** Restam apenas 2 dias para a conclusão das frentes restantes (Fase 4B - Carrinho/Favoritos e acabamentos).
2. **Dependência de Credenciais de Produção do Firebase:** Os testes atuais de rotas privadas utilizam tokens locais em ambiente não-produção (`test:uid:email:nome`). A homologação do fluxo do usuário real com pop-up Google no navegador depende de conexão de rede externa e do projeto Firebase ativo.
3. **Integração com Agente ADK de IA (Emanuel):** O endpoint `/api/chat` está funcional com fallback resiliente 503, porém a URL do agente (`ADK_URL`) ainda não está ativa no ambiente local.

### Novos Riscos Identificados
1. **Bloqueio de Permissão em Arquivos Temporários do Vite no Sandbox Windows:** Na execução sandboxed pura sem bypass de terminal, o empacotador esbuild do Vite v8 pode falhar com `EPERM` ao gerar arquivos em `node_modules/.vite-temp`. A solução foi validada com execução dev/build em modo de permissão padrão do Node.

---

## 7. Pendências Priorizadas até o Freeze (20/11)

1. **Fase 4B (Front-end - Carrinho e Favoritos com Persistência) — ALTA PRIORIDADE:**
   - Criar `CartContext` e `FavoritesContext` consumindo os endpoints `/api/carrinho` e `/api/favoritos`.
   - Ligar os botões de favoritar (`ProductCard`, `Produto`, `Favoritos`) e compra (`Adicionar à cesta`, `Carrinho`, `Checkout`).
2. **B5 (Back-end / Checkout - Finalização e Pagamentos) — ALTA PRIORIDADE:**
   - Ligar a finalização do pedido no Checkout com endereço selecionado e forma de pagamento (`POST /api/carrinho/finalizar`), redirecionando para a tela de confirmação (`CheckoutSuccess`).
3. **B6 (Back-end / Front-end - Avaliações de Produtos) — MÉDIA PRIORIDADE:**
   - Confirmar se haverá formulário de avaliação ou se o MVP manterá as notas neutras conforme D-19.
4. **Alinhamento de Contrato de Exportação (Diego / Emanuel / Henry) — MÉDIA PRIORIDADE:**
   - Compartilhar com o time de BI/Analytics o padrão dos arquivos CSV gerados em `backend/exports/` e as views de integração.
5. **Limpeza e Acabamento (Fase 5) — MÉDIA/BAIXA PRIORIDADE:**
   - Limpar arquivos duplicados (`frontend/src/ProductSilhouette` e wrappers em `src/api`).
   - Revisão responsiva em 390, 768 e 1440 px nos dois temas.

---

## 8. Próximos Passos Recomendados

1. **Commitar as correções da Tarefa B3b-fix** (datas em `America/Sao_Paulo` e garantia de usuário no primeiro acesso).
2. **Iniciar a Tarefa 4B:** Implementação de `CartContext` e `FavoritesContext` no front-end conectando os fluxos autenticados aos endpoints já disponíveis e testados do back-end.
3. **Atualizar o `docs/STATUS.md`** removendo menções obsoletas de bloqueio de dataset.
