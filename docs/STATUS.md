# STATUS.md — Onde paramos

> Atualizado pelo workflow `/handoff` ao fim de cada sessão. Lido pelo `/retomar` no começo da próxima.
> Prazos: congelamento de código **20/11**; apresentação **23/11**.

**Última atualização:** 17/11/2026 (Correções visuais e de texto da Home e Layout: Logo em Header 40px e Footer 36px com .container unificado, Hero com arte geométrica contida e destaque "horizonte.", Banner Editorial alinhado, Faixa de pilares honestos com link de privacidade, scroll-margin-top em #novidades, categorias via useCategorias com mapa de ícones e sem mocks D-19, EmptyState de Favoritos com ícone Heart, favicon em public/favicon.svg)
**Fase atual:** 3. Estrutura das telas (Fases 0, 1, 2 e 3 concluídas no front-end; rotas legais integradas; aguardando dataset/back-end para Fase 4)

## Bloqueios externos

- **Dataset (Diego):** ainda não chegou. Sem ele, não há dados reais nas telas. **Não usamos mocks** (ver D-19).
- **Back-end (Caio):** será feito depois do front. Telas de dados ficam com estrutura e estados até lá.

## Em andamento

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

- [x] `components/ui/`: Button [x], IconButton [x], Field [x], Checkbox [x], Radio [x], Chip [x], ColorSwatch [x], Badge [x], RatingPill [x], Accordion [x], QuantityStepper [x], ProductImage [x], EmptyState [x], ThemeToggle [x], Logo [x]

### Fase 2. O que não depende de dados (Dados + UI)

- [x] Dados: `utils/formatCurrency.js` e `formatDate.js`
- [x] Dados: `src/api/client.js` (fetch real, `VITE_API_URL`, `Authorization`, campo `erro`)
- [x] Dados: `src/firebase.js` e `AuthContext` (Google, e-mail/senha, sair, recuperar senha por link)
- [x] UI: Header e Footer
- [x] UI: rotas e `PrivateRoute`
- [x] UI: tela de Login
- [x] UI: `ChatWidget` (só a interface, sem resposta real)

### Fase 3. Estrutura das telas (UI, sem dados)

Cada tela com layout completo, componentes recebendo dados por props e estados de carregando, erro e vazio.

- [x] Home
- [x] Catálogo (filtros preço, tamanho, categoria; busca; paginação)
- [x] Produto (cor, tamanho, comentários, semelhantes)
- [x] Favoritos
- [x] Carrinho
- [x] Checkout simulado
- [x] Perfil com endereços
- [x] Meus pedidos

### Fase 4. Ligar à API

- [x] Confirmar `docs/API.md` com o formato real do dataset e API local
- [x] Dados (Tarefa 4A): serviços (`services/api.js`, `services/produtosService.js`, `services/mapeadores.js`) e hooks de produtos (`useCategorias`, `useProdutos`, `useNovidades`, `useProduto`, `useSemelhantes`, `useAvaliacoes`)
- [x] Dados: `CartContext` e `FavoritesContext` (e camada de dados de rotas privadas: carrinho, favoritos, pedidos, perfil, endereços)
- [x] UI (Tarefa 4A UI): ligar hooks às páginas (Home, Catálogo, Produto)
- [ ] Chat: ligar à rota `/api/chat`

### Fase 5. Acabamento

- [ ] Revisão responsiva em 390, 768 e 1440 px
- [ ] README do projeto e roteiro da demo (3 minutos)

## Pedidos entre agentes

- _(Novo)_ De Dados para UI (Tarefa 4B UI): A camada de dados de rotas privadas está completa, tipada/mapeada e validada com sucesso contra a API real.
  - Providers globais já plugados no `main.jsx`: `FavoritosProvider` e `CarrinhoProvider` envolvem `<App />`.
  - Contextos & Hooks:
    - `useFavoritos()`: `{ itens, favoritos, skus, total, isFavorito(sku), alternar(sku), carregando, erro, recarregar }`. Tem atualização otimista instantânea e rollback automático em falhas de API/rede. Se deslogado, retorna `{ precisaLogin: true }` sem chamar API.
    - `useCarrinho()`: `{ itens, subtotal, frete, total, qtdTotal, adicionar({ produtoId, tamanho, cor, quantidade }), alterarQuantidade(sku, tamanho, cor, quantidade), remover(sku, tamanho, cor), limpar(), carregando, erro, recarregar }`. Tem atualização otimista e rollback automático. Totais vêm sempre do back-end (`/api/carrinho`). Se deslogado, retorna `{ precisaLogin: true }` sem chamar API.
    - `usePedidos()`: `{ pedidos, cancelando, cancelarPedido(id), carregando, erro, recarregar }`.
    - `usePerfil()`: `{ perfil, salvando, salvarPerfil({ nome, telefone }), carregando, erro, recarregar }`.
    - `useEnderecos()`: `{ enderecos, salvando, criarEndereco, editarEndereco, excluirEndereco, definirPadrao, carregando, erro, recarregar }`.
  - Serviços diretos em `src/services/` (`favoritosService`, `carrinhoService`, `pedidosService`, `perfilService`, `enderecosService`) usam `api.js` nativo com Bearer e `X-Sessao-Id`, suportam `signal` e tratam 401 com evento de sessão expirada.
  - Próximo passo para UI: ligar as páginas privadas (`Favoritos.jsx`, `Carrinho.jsx`, `Checkout.jsx`, `Pedidos.jsx`, `Perfil.jsx`) aos respectivos hooks/contextos.

- _(Resolvido em 18/11)_ De Dados para UI (Tarefa 4A UI): a camada de dados e hooks de produtos está pronta e validada contra a API real (`http://localhost:3000`). Os hooks `useCategorias`, `useProdutos(filtros)`, `useNovidades()`, `useProduto(id)`, `useSemelhantes(id)` e `useAvaliacoes(id)` estão disponíveis em `src/hooks/` devolvendo `{ dados, carregando, erro, recarregar }`. O `ProductCard` já repassa `produto={produto}` para o `ProductImage` sem alterar silhuetas. Ligar os hooks às páginas de Home, Catálogo e Produto.

- _(Novo)_ Pedido ao Design: conferir estado desabilitado de Button primário (`src/components/ui/Button/Button.module.css` seletor `.primary:disabled`); caso a especificação do tema escuro exija que o botão primário desabilitado preserve texto com `--color-brand-contrast` (ex.: com `background: var(--color-brand)` e `opacity: 0.45`), atualizar a regra correspondente em `components/ui/`.
- _(Resolvido em 17/11)_ De Design para UI: componente `ThemeToggle` criado e disponível em `src/components/ui/ThemeToggle/ThemeToggle.jsx` e logo SVG oficial integrada no Header e Footer.
- Pedido ao Design: adicionar suporte a botão de mostrar/ocultar senha no componente base `Field` (`src/components/ui/Field/Field.jsx`) para eliminar a necessidade de `PasswordField` local na tela de Login.
- _(Resolvido em 17/11)_ Integrado suporte a cor e categoria no `ProductCard` e `ProductGallery` conforme pedido de Design; `ProductImage` atualiza a cor dinamicamente ao selecionar no `ColorSwatch`.
- Pedido ao Design: atualizar a especificação do Header em `docs/DESIGN.md` conforme decisão D-20 (navegação central com "Início" e "Catálogo"; usuário deslogado vê botões "Entrar" e "Cadastre-se"; ícones de favoritos, cesta e conta visíveis apenas para usuário logado).
- Pedido ao Design: fazer com que o componente base `Button` (`src/components/ui/Button/Button.jsx`) aceite a prop `para` (renderizando `<Link to={para}>` do React Router quando informada), permitindo navegação direta sem aninhar botão dentro de link e sem duplicar estilos de botão em CSS Modules.
- _(Resolvido em 16/11)_ Removido acordeão fixo "Materiais e composição" de `Produto.jsx` (regra D-19) e mantido texto institucional neutro de entrega e devoluções.
- _(Resolvido em 16/11)_ Substituídas variáveis CSS inexistentes em `ReviewCard`, `ProductGallery`, `ProductReviews` e `Produto` por valores diretos (`line-height` e `transition`). Varredura em todo o `src/` resultou em 0 variáveis indefinidas.
- _(Resolvido em 15/11)_ Correção e alinhamento de tokens do `Badge` em `components/ui/` (`neutro`, `escuro`, `perigo`), com verificação de `ColorSwatch` e `QuantityStepper`.
- _(Resolvido em 15/11)_ Componentes `ColorSwatch`, `QuantityStepper` e `Badge` integrados na tela de Produto e disponíveis para as próximas telas pelo agente UI.
- _(Resolvido em 15/11)_ Componentes de base (`Checkbox`, `Radio`, `Chip`, `Accordion`, `Field`) integrados no `FilterPanel` e no Catálogo pelo agente UI.
- _(Resolvido em 15/11)_ Integração do `IconButton` no `Header` (favoritos, cesta, conta) e no `FavoriteButton` concluída pelo UI.
- _(Resolvido em 15/11)_ `IconButton` criado com CSS Module, área de toque de 44px, badge de contador, navegação por Link e estado ativo.
- _(Resolvido em 15/11)_ Revisão de `EmptyState`, `ProductImage` e `RatingPill` realizada por Design: tokens conferidos, acessibilidade aprimorada e aninhamento inválido de botão corrigido.

## Problemas conhecidos

- Informações de materiais e composição na página de Produto dependem da chegada do dataset e de confirmação no `docs/API.md` (Fase 4).
- `Home.jsx` usa a prop `estadoInicial` só para visualizar os estados; remover quando a Home usar o hook de dados (Fase 4).
- `Home.jsx` define `categorias = []` e `produtos = []` como props padrão para manter a vitrine funcional sem dados; substituir pela integração dos hooks na Fase 4.
- `Catalogo.jsx` usa a prop `estadoInicial` só para visualizar os estados; remover quando o Catálogo usar o hook de dados (Fase 4).
- `Catalogo.jsx` define `produtos = []`, `categorias = []` e `tamanhos = []` como props padrão para manter o catálogo funcional sem dados; substituir pela integração dos hooks na Fase 4.
- `Produto.jsx` usa a prop `estadoInicial` só para visualizar os estados; remover quando o Produto usar o hook de dados (Fase 4).
- `Produto.jsx` possui botão de favoritos apenas visual com toggle local; integrar ao `FavoritesContext` na Fase 4.
- `Produto.jsx` recebe `onAdicionar` como prop; conectar ao `CartContext` na Fase 4.
- `ProductCard.jsx` e `FavoriteButton.jsx` possuem botão de favoritos apenas visual com `preventDefault`; integrar ao `FavoritesContext` na Fase 4.
- `Favoritos.jsx` usa a prop `estadoInicial` só para visualizar os estados; remover quando Favoritos usar o hook de dados (Fase 4).
- `Favoritos.jsx` define `produtos = []` como prop padrão e recebe `onFavoritar` como prop; conectar ao `FavoritesContext` na Fase 4.
- `Carrinho.jsx` usa a prop `estadoInicial` só para visualizar os estados; remover quando o Carrinho usar o hook de dados (Fase 4).
- `Carrinho.jsx` define `carrinho = { itens: [], subtotal: 0, frete: 0, total: 0 }` como prop padrão e recebe `onAlterarQuantidade` e `onRemover` como props; conectar ao `CartContext` na Fase 4.
- `OrderSummary.jsx` recebe `total` por prop e nunca calcula no front; na Fase 4 os totais virão calculados diretamente da API (`/api/carrinho`).
- `Checkout.jsx` usa props `enderecos = []`, `carrinho` e `estadoInicial` para testes de visualização; integrar com `useEnderecos` e `CartContext` na Fase 4.
- `Checkout.jsx` recebe `onFinalizar` por prop; conectar à rota `/api/carrinho/finalizar` na Fase 4.
- `Pedidos.jsx` usa a prop `pedidos = []` e `estadoInicial` para testes de visualização; integrar com `usePedidos` na Fase 4.
- `Perfil.jsx` usa props `perfil = { nome: "", email: "", telefone: "" }`, `enderecos = []` e `estadoInicial` para testes de visualização; integrar com hooks de usuário e endereços na Fase 4.
- `PerfilDadosSection.jsx` recebe `onSalvarPerfil` por prop; conectar à rota `/api/usuarios/perfil` (PUT) na Fase 4.
- `PerfilEnderecosSection.jsx` e `PerfilEnderecoForm.jsx` recebem `onSalvarEndereco` e `onExcluirEndereco` por props; conectar aos endpoints `/api/enderecos` na Fase 4.
- `ChatWidget.jsx` está montado no `Layout` para usuário logado com `sessaoId` em memória; o envio real (`onEnviar`) será conectado à rota `POST /api/chat` na Fase 4 (atualmente exibe estado de indisponibilidade com retry).

## Registro de sessões

| Data  | O que foi feito                                                                                                                                                                                                                        | Commit sugerido                                                                                  | Próximo passo                                                                        |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| 15/11 | Kit de agentes, design e contexto criado (sem mocks)                                                                                                                                                                                   | `chore: adiciona kit de agentes, design e contexto`                                              | Fase 0                                                                               |
| 15/11 | Criados `formatCurrency`, `formatDate`, `api/client.js`, `firebase.js` e `AuthContext`                                                                                                                                                 | `feat(dados): cria formatadores, cliente HTTP e AuthContext`                                     | UI: Header, Footer, rotas/`PrivateRoute` e Login (e criar `.env` local)              |
| 15/11 | Completados `firebase.js` (senderId, storageBucket, `GoogleAuthProvider`), tradução de erros no `AuthContextProvider.jsx`, `.env.example` e `!.env.example` no `.gitignore`                                                            | `feat(dados): completa config do Firebase, tradução de erros e .env.example`                     | UI: Header, Footer, rotas/`PrivateRoute`, Login e `ChatWidget`                       |
| 15/11 | Envolvido app com `BrowserRouter` e `AuthProvider`; criados `Header`, `Footer`, `PrivateRoute`, `Layout`, `PageSkeleton` e rotas públicas/privadas em `App.jsx`                                                                        | `feat(ui): cria Header, Footer, PrivateRoute e rotas principais`                                 | UI: tela de Login e `ChatWidget` (e Design: `IconButton` e `EmptyState`)             |
| 15/11 | Implementada tela de Login (`/login`) com 3 modos (entrar, criar conta, recuperar senha), integração ao `useAuth`, validações nativas, acessibilidade e design responsivo                                                              | `feat(ui): implementa tela de Login com três modos e autenticação`                               | UI: `ChatWidget` (e Design: `IconButton` e `EmptyState`)                             |
| 15/11 | Implementada estrutura da Home (`/`) com seções (hero, categorias, vitrine/novidades, benefícios), componentes de dados via props (`CategoryList`, `ProductGrid`, `ProductCard`), `ProductImage`, `RatingPill`, `EmptyState` e estados | `feat(ui): implementa estrutura da Home com seções e componentes de vitrine`                     | UI: Catálogo (`/catalogo`) ou `ChatWidget`                                           |
| 15/11 | Revisão de Design em `src/components/ui/` (EmptyState, ProductImage, RatingPill): tokens de controle, acessibilidade (role="img", aria-hidden), remoção de aninhamento button/link                                                     | `style(ui): padroniza tokens e acessibilidade de EmptyState, ProductImage e RatingPill`          | Design: IconButton ou UI: Catálogo (`/catalogo`)                                     |
| 15/11 | Criado `src/components/ui/IconButton` com CSS Module, tokens de 44px, badge de contador (99+), suporte a Link/button e estado ativo                                                                                                    | `feat(ui): cria componente IconButton com contador e navegação por Link`                         | UI: trocar links do Header e FavoriteButton por IconButton ou Catálogo (`/catalogo`) |
| 15/11 | Integrado `IconButton` no `Header` e no `FavoriteButton`, com remoção de CSS não utilizado e resolução do pedido entre agentes                                                                                                         | `refactor(ui): integra IconButton no Header e FavoriteButton`                                    | UI: Catálogo (`/catalogo`) ou `ChatWidget`                                           |
| 15/11 | Criados componentes base `Checkbox`, `Radio`, `Chip`, `Accordion` e `Field` em `src/components/ui/` com CSS Modules, tokens e acessibilidade (aria-describedby, aria-pressed)                                                          | `feat(ui): cria componentes Checkbox, Radio, Chip, Accordion e Field`                            | UI: tela de Catálogo (`/catalogo`)                                                   |
| 15/11 | Implementada estrutura da tela de Catálogo (`/catalogo`) com FilterPanel (desktop e mobile), filtros na URL (useSearchParams), paginação, ordenação e estados                                                                          | `feat(ui): implementa estrutura do Catálogo com filtros e paginação`                             | UI: tela de Produto (`/produto/:id`) ou `ChatWidget`                                 |
| 15/11 | Criados `ColorSwatch`, `QuantityStepper` e `Badge` em `src/components/ui/` com CSS Modules, tokens, área de toque de 44px e acessibilidade                                                                                             | `feat(ui): cria componentes ColorSwatch, QuantityStepper e Badge`                                | UI: tela de Produto (`/produto/:id`)                                                 |
| 15/11 | Implementada estrutura da tela de Produto (`/produto/:id`) com galeria 4:5, seleção de cor/tamanho (D-07), ReviewCard, resumo de notas e produtos semelhantes                                                                          | `feat(ui): implementa estrutura da tela de Produto`                                              | UI: tela de Favoritos (`/favoritos`) ou `ChatWidget`                                 |
| 15/11 | Auditoria e alinhamento de tokens em `src/components/ui/Badge` (`neutro` com `color: var(--color-muted)`), conferência de `ColorSwatch`/`QuantityStepper` e registro de pedidos ao UI/Revisor                                          | `fix(ui): ajusta token de texto no Badge e audita componentes base`                              | UI: corrigir acordeão em Produto e ajustar tokens inexistentes                       |
| 16/11 | Correção de variáveis CSS inexistentes em `ReviewCard`, `ProductGallery`, `ProductReviews` e `Produto`; remoção de texto fixo de materiais em `Produto.jsx` (D-19)                                                                     | `fix(ui): remove texto fixo de materiais e substitui variáveis inexistentes por valores diretos` | UI: tela de Favoritos (`/favoritos`) ou `ChatWidget`                                 |
| 16/11 | Implementada estrutura das telas Favoritos (`/favoritos`) e Carrinho (`/carrinho`), criando `CartItem`, `OrderSummary`, `FavoritosSkeleton`, `CarrinhoSkeleton`, com suporte a estados, acessibilidade e handlers por props            | `feat(ui): implementa estrutura das telas de Favoritos e Carrinho`                               | UI: Checkout simulado (`/checkout`) ou `ChatWidget`                                  |
| 16/11 | Implementada estrutura das telas Checkout (`/checkout`) e Meus pedidos (`/pedidos`), com AddressOption, PaymentOptions, OrderCard, AccountNav, CheckoutHeader, CheckoutSuccess e skeletons                                             | `feat(ui): implementa estrutura das telas de Checkout e Pedidos`                                 | UI: tela de Perfil com endereços (`/perfil`) ou `ChatWidget`                         |
| 16/11 | Simplificação do Header (desktop e mobile) conforme D-20 (Início e Catálogo; Entrar/Cadastre-se deslogado; favoritos/cesta/conta logado), sem flash ao recarregar, e suporte a parâmetro de URL modo no Login                          | `feat(ui): adapta Header ao estado de login e inicializa modo no Login via URL`                  | UI: `ChatWidget` ou validação com Caio                                               |
| 17/11 | Correção de layout e rolagem no Login (`/login`) com `min-height: 100dvh`, `margin-block: auto` no card e rolagem vertical sem corte de topo em janelas baixas (1366x720) | `fix(ui): corrige rolagem e centralização do formulário no Login` | UI: `ChatWidget` da Fase 2 |
| 17/11 | Auditoria de valores fixos de `docs/API.md` em `src/` (CheckoutSuccess exibe 'Pedido realizado' sem número) e modularização do Checkout com `CheckoutEndereco` e `CheckoutPagamento` (<200 linhas) | `refactor(checkout): modulariza secoes e adapta tela de sucesso sem numero` | UI: `ChatWidget` da Fase 2 |
| 17/11 | Estrutura da tela de Perfil com endereços (`/perfil`): Meus dados (nome/telefone editáveis, email readOnly), Meus endereços (AddressCard, badge padrão, ações), formulário com validações de CEP e UF, estados e sem mocks | `feat(ui): implementa estrutura da tela de Perfil com enderecos` | UI: `ChatWidget` da Fase 2 |
| 17/11 | Aprimoramento do placeholder de `ProductImage` em `components/ui/` com ícones por categoria, fundo derivado da cor (`color-mix`) e cálculo automático de contraste | `feat(design): aprimora placeholder de ProductImage com cor, categoria e contraste` | UI: integrar `cor` e `categoria` no ProductCard e ProductGallery |
| 17/11 | Integração de cor e categoria em `ProductCard` e `ProductGallery` (com sincronização no `ColorSwatch`) e ajuste da regra D-07 em `Produto` (tamanho único e produtos sem cor) | `feat(ui): integra cor e categoria no ProductCard e ProductGallery e ajusta regra D-07` | UI: `ChatWidget` da Fase 2 |
| 18/11 | Conexão da UI do Catálogo, Produto e Home com os hooks reais do agente Dados (Tarefa 4A UI), sincronização com URL, tratamento estrito de 404, novidades e ocultação de RatingPill sem avaliações | `feat(ui): conecta Catalogo, Produto e Home aos hooks da API real (tarefa 4A)` | Fase 4B: CartContext e FavoritesContext |
| 18/11 | Revisão geral consolidada do projeto (Relatório 18/11), validação de B3b-fix (fuso America/Sao_Paulo e garantia de usuário no requireAuth), lint e build do front e testes do back | `docs: gera relatorio consolidado de revisao de 18/11/2026` | Fase 4B: CartContext e FavoritesContext |
| 17/11 | Interface do `ChatWidget` (botão flutuante 60px, painel acessível com Esc/Tab trap, sessaoId em memória, boas-vindas e estados sem respostas fictícias) montada no `Layout` para usuário logado | `feat(ui): implementa interface acessivel do ChatWidget no Layout` | Fase 4: Ligar front à API (ou Design: Breadcrumb) |
| 17/11 | Refatoração de `Login.jsx` (<200 linhas) com `Field` de `ui/`, `PasswordField` local, remoção de `isMountedRef` (obsoleto no React 18) e tratamento assíncrono de promessas de navegação | `refactor(login): simplifica Login com Field, PasswordField local e trata promessas de navegacao` | Fase 4: Ligar front à API (ou Design: Breadcrumb) |
| 17/11 | Identidade visual Horizonte (D-24): tipografia Jost, temas claro e escuro em `tokens.css`, logo SVG, `ThemeToggle` acessível e refinamento de `Button`, `Field` e `Badge` | `feat(design): implementa identidade visual com temas claro/escuro, fonte Jost e ThemeToggle` | UI: integrar ThemeToggle e logo SVG no Header |
| 17/11 | Atualização visual da interface e rotas legais (D-20 emendada, D-24, D-25, D-26): Header com logo SVG, navegação e `ThemeToggle`, Footer institucional, Home com seção `#novidades`, pilares sem prazos inventados e páginas `/institucional`, `/privacidade`, `/termos` e `/cookies` com aviso acadêmico | `feat(ui): atualiza Header, Footer, Home com novidades e cria rotas institucionais e legais` | Fase 4: Ligar front à API (ou Design: Breadcrumb) |

## Relatórios de evolução

- [Relatório Consolidado 18/11/2026](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/docs/relatorios/relatorio18-11-2026-consolidado.md) *(Novo)*
- [Relatório Consolidado 17/11/2026](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/docs/relatorios/relatorio17-11-2026-consolidado.md)
- [Relatório Header 17/11/2026](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/docs/relatorios/relatorio17-11-2026-header.md)
- [Relatório Login 15/11/2026](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/docs/relatorios/relatorio15-11-2026-login.md)
- [Relatório Inicial 15/11/2026](file:///C:/projetos-lojas-horizonte/projeto-lojas-horizonte-g1/docs/relatorios/relatorio15-11-2026.md)
