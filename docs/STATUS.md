# STATUS.md — Onde paramos

> Atualizado pelo workflow `/handoff` ao fim de cada sessão. Lido pelo `/retomar` no começo da próxima.
> Prazos: congelamento de código **20/11**; apresentação **23/11**.

**Última atualização:** 15/11/2026 (implementada estrutura da página de Produto /produto/:id)
**Fase atual:** 3. Estrutura das telas (Home, Catálogo e Produto prontos; pendente Favoritos, Carrinho, Checkout, Perfil, Pedidos e ChatWidget da Fase 2)

## Bloqueios externos

- **Dataset (Diego):** ainda não chegou. Sem ele, não há dados reais nas telas. **Não usamos mocks** (ver D-19).
- **Back-end (Caio):** será feito depois do front. Telas de dados ficam com estrutura e estados até lá.

## Em andamento

- Fase 2 (UI): `ChatWidget` (só a interface, sem resposta real).
- Fase 3 (UI): Favoritos (`/favoritos`).
- Design: `Breadcrumb` em `components/ui/`.

## Roteiro por fases

Marque `[x]` quando a tarefa passar na definição de pronto (ver `AGENTS.md`).

### Fase 0. Preparação

- [x] Criar o projeto Vite (`react`, JSX) e instalar `react-router-dom`, `firebase`, `lucide-react`
- [x] Copiar este kit para a raiz; importar `tokens.css`, `reset.css`, `global.css` no `main.jsx`
- [x] Configurar alias `@` para `src/` no `vite.config.js`
- [x] Carregar a fonte Inter no `index.html`
- [x] Criar `.env` a partir do `.env.example` (Firebase e `VITE_API_URL`); conferir que está no `.gitignore`

### Fase 1. Base visual (Design)

- [ ] `components/ui/`: Button [x], IconButton [x], Field [x], Checkbox [x], Radio [x], Chip [x], ColorSwatch [x], Badge [x], RatingPill [x], Accordion [x], QuantityStepper [x], ProductImage [x], EmptyState [x]

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

- [x] Home
- [x] Catálogo (filtros preço, tamanho, categoria; busca; paginação)
- [x] Produto (cor, tamanho, comentários, semelhantes)
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

- *(Resolvido em 15/11)* Componentes `ColorSwatch`, `QuantityStepper` e `Badge` integrados na tela de Produto e disponíveis para as próximas telas pelo agente UI.
- *(Resolvido em 15/11)* Componentes de base (`Checkbox`, `Radio`, `Chip`, `Accordion`, `Field`) integrados no `FilterPanel` e no Catálogo pelo agente UI.
- *(Resolvido em 15/11)* Integração do `IconButton` no `Header` (favoritos, cesta, conta) e no `FavoriteButton` concluída pelo UI.
- *(Resolvido em 15/11)* `IconButton` criado com CSS Module, área de toque de 44px, badge de contador, navegação por Link e estado ativo.
- *(Resolvido em 15/11)* Revisão de `EmptyState`, `ProductImage` e `RatingPill` realizada por Design: tokens conferidos, acessibilidade aprimorada e aninhamento inválido de botão corrigido.

## Problemas conhecidos

- `Home.jsx` usa a prop `estadoInicial` só para visualizar os estados; remover quando a Home usar o hook de dados (Fase 4).
- `Home.jsx` define `categorias = []` e `produtos = []` como props padrão para manter a vitrine funcional sem dados; substituir pela integração dos hooks na Fase 4.
- `Catalogo.jsx` usa a prop `estadoInicial` só para visualizar os estados; remover quando o Catálogo usar o hook de dados (Fase 4).
- `Catalogo.jsx` define `produtos = []`, `categorias = []` e `tamanhos = []` como props padrão para manter o catálogo funcional sem dados; substituir pela integração dos hooks na Fase 4.
- `Produto.jsx` usa a prop `estadoInicial` só para visualizar os estados; remover quando o Produto usar o hook de dados (Fase 4).
- `Produto.jsx` possui botão de favoritos apenas visual com toggle local; integrar ao `FavoritesContext` na Fase 4.
- `Produto.jsx` recebe `onAdicionar` como prop; conectar ao `CartContext` na Fase 4.
- `ProductCard.jsx` e `FavoriteButton.jsx` possuem botão de favoritos apenas visual com `preventDefault`; integrar ao `FavoritesContext` na Fase 4.

## Registro de sessões

| Data  | O que foi feito                                                                                                                                                             | Commit sugerido                                                              | Próximo passo                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 15/11 | Kit de agentes, design e contexto criado (sem mocks)                                                                                                                        | `chore: adiciona kit de agentes, design e contexto`                          | Fase 0                                                                  |
| 15/11 | Criados `formatCurrency`, `formatDate`, `api/client.js`, `firebase.js` e `AuthContext`                                                                                      | `feat(dados): cria formatadores, cliente HTTP e AuthContext`                 | UI: Header, Footer, rotas/`PrivateRoute` e Login (e criar `.env` local) |
| 15/11 | Completados `firebase.js` (senderId, storageBucket, `GoogleAuthProvider`), tradução de erros no `AuthContextProvider.jsx`, `.env.example` e `!.env.example` no `.gitignore` | `feat(dados): completa config do Firebase, tradução de erros e .env.example` | UI: Header, Footer, rotas/`PrivateRoute`, Login e `ChatWidget`          |
| 15/11 | Envolvido app com `BrowserRouter` e `AuthProvider`; criados `Header`, `Footer`, `PrivateRoute`, `Layout`, `PageSkeleton` e rotas públicas/privadas em `App.jsx` | `feat(ui): cria Header, Footer, PrivateRoute e rotas principais` | UI: tela de Login e `ChatWidget` (e Design: `IconButton` e `EmptyState`) |
| 15/11 | Implementada tela de Login (`/login`) com 3 modos (entrar, criar conta, recuperar senha), integração ao `useAuth`, validações nativas, acessibilidade e design responsivo | `feat(ui): implementa tela de Login com três modos e autenticação` | UI: `ChatWidget` (e Design: `IconButton` e `EmptyState`) |
| 15/11 | Implementada estrutura da Home (`/`) com seções (hero, categorias, vitrine/novidades, benefícios), componentes de dados via props (`CategoryList`, `ProductGrid`, `ProductCard`), `ProductImage`, `RatingPill`, `EmptyState` e estados | `feat(ui): implementa estrutura da Home com seções e componentes de vitrine` | UI: Catálogo (`/catalogo`) ou `ChatWidget` |
| 15/11 | Revisão de Design em `src/components/ui/` (EmptyState, ProductImage, RatingPill): tokens de controle, acessibilidade (role="img", aria-hidden), remoção de aninhamento button/link | `style(ui): padroniza tokens e acessibilidade de EmptyState, ProductImage e RatingPill` | Design: IconButton ou UI: Catálogo (`/catalogo`) |
| 15/11 | Criado `src/components/ui/IconButton` com CSS Module, tokens de 44px, badge de contador (99+), suporte a Link/button e estado ativo | `feat(ui): cria componente IconButton com contador e navegação por Link` | UI: trocar links do Header e FavoriteButton por IconButton ou Catálogo (`/catalogo`) |
| 15/11 | Integrado `IconButton` no `Header` e no `FavoriteButton`, com remoção de CSS não utilizado e resolução do pedido entre agentes | `refactor(ui): integra IconButton no Header e FavoriteButton` | UI: Catálogo (`/catalogo`) ou `ChatWidget` |
| 15/11 | Criados componentes base `Checkbox`, `Radio`, `Chip`, `Accordion` e `Field` em `src/components/ui/` com CSS Modules, tokens e acessibilidade (aria-describedby, aria-pressed) | `feat(ui): cria componentes Checkbox, Radio, Chip, Accordion e Field` | UI: tela de Catálogo (`/catalogo`) |
| 15/11 | Implementada estrutura da tela de Catálogo (`/catalogo`) com FilterPanel (desktop e mobile), filtros na URL (useSearchParams), paginação, ordenação e estados | `feat(ui): implementa estrutura do Catálogo com filtros e paginação` | UI: tela de Produto (`/produto/:id`) ou `ChatWidget` |
| 15/11 | Criados `ColorSwatch`, `QuantityStepper` e `Badge` em `src/components/ui/` com CSS Modules, tokens, área de toque de 44px e acessibilidade | `feat(ui): cria componentes ColorSwatch, QuantityStepper e Badge` | UI: tela de Produto (`/produto/:id`) |
| 15/11 | Implementada estrutura da tela de Produto (`/produto/:id`) com galeria 4:5, seleção de cor/tamanho (D-07), ReviewCard, resumo de notas e produtos semelhantes | `feat(ui): implementa estrutura da tela de Produto` | UI: tela de Favoritos (`/favoritos`) ou `ChatWidget` |
