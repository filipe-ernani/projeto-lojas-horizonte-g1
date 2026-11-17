# DESIGN.md — Horizonte

Fonte de verdade visual do front-end. Se um valor não está aqui, **pergunte**; não invente.

**Referências visuais**

- Design System e Temas (Light & Dark): `horizonte-design-system.svg`, `horizonte-desktop-light.svg`, `horizonte-desktop-dark.svg` e logo oficial (`horizonte-logo.svg`).
- Mobile (390 px): Adaptação responsiva mobile-first mantendo os mesmos tokens, hierarquia e alvos de toque mínimos de 44 px.

## 1. Estilo

Editorial, acolhedor e contemporâneo: tons terrosos (terracota, marrom café e creme areia) com suporte nativo a **Modo Claro** e **Modo Escuro**, cantos arredondados e formas geométricas limpas.

- **Modo Claro:** Botão principal **marrom (`#6B4E3D`) com texto creme (`#FAF7F2`)**.
- **Modo Escuro:** Botão principal **terracota claro (`#E08E70`) com texto escuro (`#1A1412`)**.
- Sem gradientes complexos, sem emoji, sem sombras pesadas.
- **Regra de honestidade (D-19 / D-24 / D-25):** Nenhum dado inventado (sem avaliações fictícias, sem newsletter, sem prazos/valores falsos de frete). Selos "Novo" em Novidades refletem os 8 últimos SKUs do catálogo e são documentados como simulados.

Tom de texto: português do Brasil, frases curtas, "caixa de frase" (só a primeira letra maiúscula). Exemplos: "Siga o seu horizonte.", "Adicionar à cesta", "Finalizar compra".

## 2. Tokens (implementados em `src/styles/tokens.css`)

Os nomes dos tokens são mantidos para compatibilidade com os componentes existentes, alternando valores entre `:root` (claro) e `[data-theme="dark"]` (escuro), respeitando `prefers-color-scheme` no carregamento inicial quando não houver escolha salva.

### Cores — Tema Claro (`:root`)

| Token                    | Valor     | Uso                                                                      |
| ------------------------ | --------- | ------------------------------------------------------------------------ |
| `--color-paper`          | `#FAF7F2` | Fundo principal da página (creme)                                        |
| `--color-surface`        | `#F2ECE1` | Cards de filtro, resumo, endereço, pedido, faixa institucional           |
| `--color-card`           | `#EBE2D3` | Fundo da imagem do produto e banners suaves                              |
| `--color-search`         | `#F5F0E6` | Campo de busca e superfícies elevadas                                    |
| `--color-field`          | `#FFFFFF` | Campos de formulário                                                     |
| `--color-line`           | `#C7B9A5` | Bordas de inputs, divisores, desabilitado (contraste ajustado)           |
| `--color-ink`            | `#231B16` | Texto principal, títulos e ícones                                        |
| `--color-brand`          | `#6B4E3D` | Botão principal no claro, acentos escuros da marca                       |
| `--color-brand-contrast` | `#FAF7F2` | Texto sobre `--color-brand` (contraste 7,06:1)                           |
| `--color-accent`         | `#C9795D` | Terracota: detalhes gráficos, texto grande (>=18px bold), ícones, badges |
| `--color-accent-ink`     | `#231B16` | Texto escuro sobre badge terracota (contraste 4,77:1)                    |
| `--color-muted`          | `#63554B` | Texto secundário (contraste >= 4,85:1 sobre `--color-paper`)             |
| `--color-link`           | `#6B4E3D` | Links e ações textuais no claro (garante AA >= 4,5:1)                    |
| `--color-star`           | `#C9795D` | Estrelas e indicadores de nota                                           |
| `--color-danger`         | `#C93B3B` | Borda de erro, "Sair"                                                    |
| `--color-danger-text`    | `#9E2424` | Texto de erro e cancelado (contraste AA)                                 |

### Cores — Tema Escuro (`[data-theme="dark"]`)

| Token                    | Valor     | Uso                                            |
| ------------------------ | --------- | ---------------------------------------------- |
| `--color-paper`          | `#1A1412` | Fundo principal da página (marrom carvão)      |
| `--color-surface`        | `#261E1B` | Cards de filtro, resumo, endereço, pedido      |
| `--color-card`           | `#302622` | Fundo da imagem do produto e banners           |
| `--color-search`         | `#261E1B` | Campo de busca                                 |
| `--color-field`          | `#231B18` | Campos de formulário                           |
| `--color-line`           | `#4A3C35` | Bordas, divisores, desabilitado                |
| `--color-ink`            | `#FAF7F2` | Texto principal, títulos e ícones              |
| `--color-brand`          | `#E08E70` | Botão principal no escuro (terracota luminoso) |
| `--color-brand-contrast` | `#1A1412` | Texto sobre `--color-brand`                    |
| `--color-accent`         | `#E08E70` | Acentos, links ativos, ícones de destaque      |
| `--color-accent-ink`     | `#1A1412` | Texto sobre badge terracota                    |
| `--color-muted`          | `#B8ABA0` | Texto secundário (contraste > 6,5:1 no escuro) |
| `--color-link`           | `#E08E70` | Links e ações textuais                         |
| `--color-star`           | `#E08E70` | Estrelas e indicadores                         |
| `--color-danger`         | `#E56B6B` | Borda de erro, "Sair"                          |
| `--color-danger-text`    | `#F28B8B` | Texto de erro e cancelado                      |

Regra de contraste: Nunca usar `#C9795D` para texto pequeno (< 18px) sobre fundo claro `#FAF7F2` (contraste 3,08:1 reprova WCAG AA).

### Tipografia

Fonte: **Jost** (Google Fonts, pesos 400, 500, 600, 700), carregada no `index.html` com fallback `sans-serif`.

| Uso                      | Tamanho                              | Peso      |
| ------------------------ | ------------------------------------ | --------- |
| Título de página (h1)    | 32 px (mobile 28 px)                 | 600 a 700 |
| Hero                     | 48 px (mobile 32 px)                 | 600 a 700 |
| Título de seção (h2)     | 24 px (mobile 20 px)                 | 600 a 700 |
| Título de card           | 17 a 20 px                           | 600       |
| Corpo                    | 15 a 16 px                           | 400 a 500 |
| Secundário               | 13 a 14 px                           | 400 a 500 |
| Logo (texto "HORIZONTE") | 20 px, espaçamento de letras `.18em` | 400 a 500 |

### Espaçamento, raios, sombras

- Base de 4 px. Escala em `--space-*` (1 = 4 px até 24 = 96 px).
- Raios: `--radius-sm` 8, `--radius-md` 12 (botões e campos), `--radius-lg` 16 (cards e imagens), `--radius-xl` 20 (painel do chat e banners), `--radius-pill` 999 (chips, selos, avatares, toggle).
- Sombras só em dois lugares: botão flutuante do chat (`--shadow-fab`) e painel do chat (`--shadow-panel`).

### Layout

- Container: largura máxima **1200 px**, centralizado, margem lateral 16 px (mobile) ou 24 px (desktop).
- Alturas de controle: botão e campo **52 px** (grande) ou **44 px** (compacto). Área de toque mínima **44 px**.
- Header: 72 px.

### Breakpoints (CSS mobile-first)

| Faixa   | Largura         | Grade de produtos |
| ------- | --------------- | ----------------- |
| Mobile  | até 639 px      | 2 colunas         |
| Tablet  | 640 a 1023 px   | 3 colunas         |
| Desktop | 1024 px ou mais | 4 colunas         |

### Foco e acessibilidade

- Foco visível: `outline: 2px solid var(--color-accent); outline-offset: 2px`.
- Texto normal com contraste mínimo de 4,5:1.
- Ícone sem texto sempre com `aria-label`.
- Nunca `div` ou `span` clicável: use `<button>` ou `<a>`.

## 3. Ícones e imagens

- **Logo (`src/assets/horizonte-logo.svg`):** Semicírculo superior terracota e inferior marrom (adaptando cores via CSS `currentColor` / variáveis no modo escuro) + wordmark `HORIZONTE`.
- **Ícones:** `lucide-react`, traço 1.8, 20 a 24 px. Mapa: favoritos `Heart`, cesta `ShoppingBag`, perfil `User`, busca `Search`, filtros `SlidersHorizontal`, nota `Star`, chat `MessageCircle`, enviar `Send`, fechar `X`, mais/menos `Plus`/`Minus`, voltar `ChevronLeft`, abrir seção `ChevronDown`, remover `Trash2`, tema claro/escuro `Sun`/`Moon`.
- **Imagem de produto:** proporção **4:5**, fundo `--color-card`, raio 16. Placeholder estilizado com ícone por categoria e cor do produto (`ProductImage`).
- **Ilustração do Hero e Banner Editorial:** Arte vetorial geométrica do horizonte (semicírculo terracota + arcos concêntricos + silhueta de peça) sem hotlink externo.

## 4. Componentes base (`src/components/ui/`, dono: agente Design)

| Componente                 | Especificação                                                                                                                                                                                                                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button`                   | Variantes `primary` (`--color-brand` com texto `--color-brand-contrast`), `outline` (fundo transparente, borda `--color-line` ou `--color-ink`), `ghost` (sem fundo). Alturas 52 px e 44 px. Raio 12 (ou pill no hero). Estado `disabled` com opacidade/borda `--color-line`. Prop `fullWidth`. |
| `IconButton`               | Círculo 44 px, ícone 22 px, fundo transparente, hover `--color-surface`. Exige `aria-label`. Variante com contador (selo `--color-accent` 18 px com texto `--color-accent-ink`).                                                                                                                |
| `ThemeToggle`              | Interruptor pílula 44 px de altura com ícones `Sun` e `Moon`, `aria-label="Alternar tema claro e escuro"`, `aria-pressed`, persiste escolha em `localStorage` (`horizonte-theme`) e aplica `data-theme` no `<html>`.                                                                            |
| `Field`                    | `<label>` + campo 52 px, fundo `--color-field`, borda `1px solid var(--color-line)`, raio 12, foco com anel `--color-accent`. Mostra ajuda e erro (`--color-danger-text`). Versão `readOnly` com fundo `--color-surface`.                                                                       |
| `Checkbox`, `Radio`        | 20 px, `accent-color: var(--color-brand)`, dentro de `<label>`.                                                                                                                                                                                                                                 |
| `Chip`                     | Pílula 36 a 40 px, borda `--color-line`, fundo `--color-field`. Selecionado: fundo `--color-brand` e texto `--color-brand-contrast`.                                                                                                                                                            |
| `ColorSwatch`              | Círculo 36 px com borda `--color-line`. Selecionado: anel duplo (2 px `--color-paper` + 2 px `--color-accent`). `aria-pressed` e `aria-label` com o nome da cor.                                                                                                                                |
| `Badge`                    | Selo pílula 28 px. `ok` (`--color-brand` / `--color-brand-contrast`), `novo` (`--color-accent` / `--color-accent-ink`), `cancel` (borda `--color-danger`, texto `--color-danger-text`).                                                                                                         |
| `RatingPill`               | Pílula `--color-field` com borda `--color-line`, estrela `--color-star` e nota ("4.9").                                                                                                                                                                                                         |
| `Accordion`                | `<details>` com título 17 px semibold, divisor `--color-line`, seta à direita.                                                                                                                                                                                                                  |
| `QuantityStepper`          | Pílula 40 px com botões −/+ de 40 px e número no centro.                                                                                                                                                                                                                                        |
| `Breadcrumb`, `Pagination` | Texto 14 px muted; paginação com quadrados 44 px (atual: `--color-brand`).                                                                                                                                                                                                                      |
| `EmptyState`               | Cartão `--color-surface`, título, frase curta e botão.                                                                                                                                                                                                                                          |
| `ProductImage`             | Imagem 4:5 com placeholder colorido por hex e ícone de categoria.                                                                                                                                                                                                                               |

## 5. Componentes de negócio (`src/components/`, dono: agente UI)

| Componente       | O que mostra                                                                                                                                                                                                                                                              |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Header`         | Logo SVG, nav (**Início**, **Novidades**, **Masculino**, **Feminino** — D-20 emendada), busca (máx. 420 px), ícones perfil, favoritos, cesta (com contador) e `ThemeToggle`. Linha inferior `--color-line`. Mobile: nav e toggle no menu (`<details>`), busca abaixo.     |
| `Footer`         | Logo SVG + frase institucional curta, links de navegação (**Institucional**, **Política de Privacidade**, **Termos de Uso**, **Política de Cookies**) e linha de copyright centralizada, muted. Sem newsletter.                                                           |
| `ProductCard`    | Imagem 4:5 com `FavoriteButton` no canto superior direito (40 px, redondo) e selo "Novo" opcional (`Badge`). Abaixo: preço em negrito, nome 15 px, categoria muted 14 px.                                                                                                 |
| `FavoriteButton` | Coração vazio ou preenchido em `--color-accent`. `aria-pressed`.                                                                                                                                                                                                          |
| `FilterPanel`    | Cards `--color-surface`: Preço (mínimo e máximo), Tamanho (chips), Categoria (checkboxes com as 9 categorias reais). Botões "Limpar todos" e "Aplicar".                                                                                                                   |
| `ReviewCard`     | Fundo `--color-search`, avatar redondo, nome, data, `RatingPill`, texto. (Exibido apenas quando houver avaliações reais da API).                                                                                                                                          |
| `AddressCard`    | Fundo `--color-surface`, apelido, selo "Padrão", linhas de endereço, ações Editar, Remover, Definir padrão.                                                                                                                                                               |
| `OrderCard`      | Número, data, `Badge` de status, miniaturas, total, "Ver detalhes".                                                                                                                                                                                                       |
| `CartItem`       | Miniatura 110×138, nome, "Tamanho: M · Cor: Preto", `QuantityStepper`, preço, "Remover".                                                                                                                                                                                  |
| `OrderSummary`   | Cartão `--color-surface`: Subtotal, Frete (simulado), Total grande, botão principal. Texto "Compra simulada: nenhum pagamento real é feito."                                                                                                                              |
| `ChatWidget`     | Botão flutuante `--color-brand` 60 px (canto inferior direito, 32 px de margem). Abre painel 380×600 (mobile: tela cheia): cabeçalho `--color-brand`, mensagens (assistente em `--color-surface` à esquerda, usuário em `--color-brand` à direita), campo + botão enviar. |

## 6. Telas

Todas usam `Header` e `Footer`, exceto Login e Checkout (cabeçalho simplificado com passos).

| Rota             | Tela                | Estrutura                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`         | Login               | Desktop: metade arte/placeholder editorial com slogan, metade formulário (e-mail, senha, "Esqueceu sua senha?", Entrar, Continuar com Google, Cadastrar-se). Recuperar senha: bloco com e-mail e "Enviar link". Mobile: só o formulário.                                                                                                                                                                                                                                              |
| `/`              | Home                | 1. Hero editorial ("Siga o seu horizonte." + subtítulo + CTA "Explorar catálogo" e "Ver novidades" + arte vetorial do horizonte); 2. "Categorias" (grade/carrossel com as 9 categorias reais do catálogo); 3. Secão `#novidades` ("Novidades" com os 8 últimos SKUs do catálogo e selo "Novo" simulado); 4. Banner editorial ("Nova coleção casual" -> `/catalogo`); 5. Faixa institucional de pilares (sem números ou prazos inventados). Sem avaliações fictícias e sem newsletter. |
| `/catalogo`      | Catálogo            | Título + contagem de produtos; `FilterPanel` à esquerda; chips dos filtros ativos, "Ordenar por" e grade; paginação. Aceita `?busca=` e `?categoria=` (ex.: `?categoria=Masculino`, `?categoria=Feminino`).                                                                                                                                                                                                                                                                           |
| `/produto/:id`   | Produto             | Galeria (miniaturas + imagem principal 4:5) e coluna de detalhes: categoria, nome, preço, **Cores** (`ColorSwatch`), **Tamanho** (`Chip`), "Adicionar à cesta" + coração, acordeões Descrição, Materiais, Entrega. Abaixo: Avaliações reais (se existirem na API) e Produtos semelhantes.                                                                                                                                                                                             |
| `/favoritos`     | Favoritos           | Grade de `ProductCard` com coração preenchido; botão "Escolher tamanho" abaixo; `EmptyState` se vazio.                                                                                                                                                                                                                                                                                                                                                                                |
| `/carrinho`      | Cesta               | Lista de `CartItem` + `OrderSummary` à direita (desktop) ou abaixo (mobile). Link "Continuar comprando".                                                                                                                                                                                                                                                                                                                                                                              |
| `/checkout`      | Checkout simulado   | Passos (Cesta, Entrega e pagamento, Confirmação). Endereços salvos + pagamento simulado (Pix, Cartão, Boleto) + `OrderSummary`.                                                                                                                                                                                                                                                                                                                                                       |
| `/perfil`        | Perfil              | Menu lateral + Dados pessoais + Meus endereços.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `/pedidos`       | Meus pedidos        | Menu lateral + lista de `OrderCard`.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `/institucional` | Institucional       | Página institucional sobre a Lojas Horizonte (aviso de projeto acadêmico).                                                                                                                                                                                                                                                                                                                                                                                                            |
| `/privacidade`   | Privacidade         | Política de Privacidade descrevendo o uso real de Firebase Auth, `localStorage` e eventos (aviso de projeto acadêmico).                                                                                                                                                                                                                                                                                                                                                               |
| `/termos`        | Termos de Uso       | Termos de Uso da plataforma simulada (aviso de projeto acadêmico).                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `/cookies`       | Política de Cookies | Explicação transparente sobre `localStorage` (tema, sessão/carrinho) e cabeçalho `X-Sessao-Id` (aviso de projeto acadêmico).                                                                                                                                                                                                                                                                                                                                                          |

Telas privadas (exigem login): Favoritos, Carrinho, Checkout, Perfil, Pedidos. As páginas legais (`/institucional`, `/privacidade`, `/termos`, `/cookies`) são públicas.

## 7. Estados que toda tela precisa

- **Carregando:** blocos `--color-surface` no lugar do conteúdo, sem spinner.
- **Erro:** frase curta ("Não foi possível carregar. Tente novamente.") + botão "Tentar de novo".
- **Vazio:** `EmptyState` com próxima ação.
- **Sucesso de formulário:** mensagem curta abaixo do botão, sem pop-up.

## 8. CSS Modules: como escrever

Proibido: `#hex` e valores em `px` de espaçamento fora de `tokens.css`, `!important`, estilo inline (exceto valor dinâmico vindo de props, como a cor do produto em `ProductImage`), seletor de tag fora de `src/styles/`.

## 9. Checklist visual (agente Revisor)

- Cores, raios e tamanhos vêm de tokens (funcionando tanto no tema claro quanto no escuro).
- Contraste AA respeitado (nunca terracota `#C9795D` em texto pequeno no tema claro).
- Nenhuma rolagem horizontal em 390, 768 e 1440 px.
- Grade com 2, 3 e 4 colunas nas faixas certas.
- Alvos de toque de 44 px ou mais.
- Foco visível ao navegar com Tab.
- Nenhum dado inventado (avaliações falsas, prazos de frete ou newsletter).
