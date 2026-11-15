# STATUS.md — Onde paramos

> Atualizado pelo workflow `/handoff` ao fim de cada sessão. Lido pelo `/retomar` no começo da próxima.
> Prazos: congelamento de código **20/11**; apresentação **23/11**.

**Última atualização:** 15/11/2026 (tela de Login implementada com modos entrar, cadastrar e recuperar senha)
**Fase atual:** 2. O que não depende de dados (layout, rotas e Login prontos; falta ChatWidget)

## Bloqueios externos

- **Dataset (Diego):** ainda não chegou. Sem ele, não há dados reais nas telas. **Não usamos mocks** (ver D-19).
- **Back-end (Caio):** será feito depois do front. Telas de dados ficam com estrutura e estados até lá.

## Em andamento

- Fase 2 (UI): `ChatWidget` (só a interface, sem resposta real).
- Design: `IconButton` e `EmptyState` em `components/ui/`.

## Roteiro por fases

Marque `[x]` quando a tarefa passar na definição de pronto (ver `AGENTS.md`).

### Fase 0. Preparação

- [x] Criar o projeto Vite (`react`, JSX) e instalar `react-router-dom`, `firebase`, `lucide-react`
- [x] Copiar este kit para a raiz; importar `tokens.css`, `reset.css`, `global.css` no `main.jsx`
- [x] Configurar alias `@` para `src/` no `vite.config.js`
- [x] Carregar a fonte Inter no `index.html`
- [x] Criar `.env` a partir do `.env.example` (Firebase e `VITE_API_URL`); conferir que está no `.gitignore`

### Fase 1. Base visual (Design)

- [ ] `components/ui/`: Button, IconButton, Field, Checkbox, Radio, Chip, ColorSwatch, Badge, RatingPill, Accordion, QuantityStepper, ProductImage, EmptyState

### Fase 2. O que não depende de dados (Dados + UI)

- [x] Dados: `utils/formatCurrency.js` e `formatDate.js`
- [x] Dados: `src/api/client.js` (fetch real, `VITE_API_URL`, `Authorization`, campo `erro`)
- [x] Dados: `src/firebase.js` e `AuthContext` (Google, e-mail/senha, sair, recuperar senha por link)
- [x] UI: Header e Footer
- [x] UI: rotas e `PrivateRoute`
- [x] UI: tela de Login
- [ ] UI: `ChatWidget` (só a interface, sem resposta real)

### Fase 3. Estrutura das telas (UI, sem dados)

Cada tela com layout completo, componentes recebendo dados por props e estados de carregando, erro e vazio.

- [ ] Home
- [ ] Catálogo (filtros preço, tamanho, categoria; busca; paginação)
- [ ] Produto (cor, tamanho, comentários, semelhantes)
- [ ] Favoritos
- [ ] Carrinho
- [ ] Checkout simulado
- [ ] Perfil com endereços
- [ ] Meus pedidos

### Fase 4. Ligar à API (BLOQUEADA até dataset e back-end)

- [ ] Confirmar `docs/API.md` com o formato real do dataset
- [ ] Dados: `src/api/` e hooks por recurso (`criar-hook-api`)
- [ ] Dados: `CartContext` e `FavoritesContext`
- [ ] UI: ligar hooks às páginas
- [ ] Chat: ligar à rota `/api/chat`

### Fase 5. Acabamento

- [ ] Revisão responsiva em 390, 768 e 1440 px
- [ ] README do projeto e roteiro da demo (3 minutos)

## Pedidos entre agentes

- **De:** UI (`ui-builder`) → **Para:** Design (`design-guardian`): criar `IconButton` (com suporte a contador) e `EmptyState` em `src/components/ui/` conforme `docs/DESIGN.md` (seção 4). Hoje `Header` usa links estilizados e as páginas usam `PageSkeleton` temporário até esses componentes existirem.

## Problemas conhecidos

(Vazio.)

## Registro de sessões

| Data  | O que foi feito                                                                                                                                                             | Commit sugerido                                                              | Próximo passo                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 15/11 | Kit de agentes, design e contexto criado (sem mocks)                                                                                                                        | `chore: adiciona kit de agentes, design e contexto`                          | Fase 0                                                                  |
| 15/11 | Criados `formatCurrency`, `formatDate`, `api/client.js`, `firebase.js` e `AuthContext`                                                                                      | `feat(dados): cria formatadores, cliente HTTP e AuthContext`                 | UI: Header, Footer, rotas/`PrivateRoute` e Login (e criar `.env` local) |
| 15/11 | Completados `firebase.js` (senderId, storageBucket, `GoogleAuthProvider`), tradução de erros no `AuthContextProvider.jsx`, `.env.example` e `!.env.example` no `.gitignore` | `feat(dados): completa config do Firebase, tradução de erros e .env.example` | UI: Header, Footer, rotas/`PrivateRoute`, Login e `ChatWidget`          |
| 15/11 | Envolvido app com `BrowserRouter` e `AuthProvider`; criados `Header`, `Footer`, `PrivateRoute`, `Layout`, `PageSkeleton` e rotas públicas/privadas em `App.jsx` | `feat(ui): cria Header, Footer, PrivateRoute e rotas principais` | UI: tela de Login e `ChatWidget` (e Design: `IconButton` e `EmptyState`) |
| 15/11 | Implementada tela de Login (`/login`) com 3 modos (entrar, criar conta, recuperar senha), integração ao `useAuth`, validações nativas, acessibilidade e design responsivo | `feat(ui): implementa tela de Login com três modos e autenticação` | UI: `ChatWidget` (e Design: `IconButton` e `EmptyState`) |
