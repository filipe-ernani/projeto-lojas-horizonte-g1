# DESIGN.md — Horizonte

Fonte de verdade visual do front-end. Se um valor não está aqui, **pergunte**; não invente.

**Referências visuais**
- Web (desktop 1440 px): canvas "Horizonte Web: telas desktop" (Artifact privado do Caio, 10 telas).
- Mobile (390 px): Figma original do Caio (telas: intro, login, recuperar senha, home, catálogo, filtros, busca, produto, comentários).
- Onde o Figma e o canvas divergirem: vale o canvas para desktop e o Figma para mobile.

## 1. Estilo

Minimalista, premium e elegante: preto, branco e cinza, muito espaço em branco, cantos arredondados, fotografia como protagonista. Botão principal sempre **preto com texto branco**. Sem gradientes, sem emoji, sem sombras pesadas.

Tom de texto: português do Brasil, frases curtas, "caixa de frase" (só a primeira letra maiúscula). Exemplos: "Descubra seu estilo e elegância", "Add a cesta" (usar **"Adicionar à cesta"**), "Finalizar compra".

## 2. Tokens (implementados em `src/styles/tokens.css`)

### Cores

| Token | Valor | Uso |
|---|---|---|
| `--color-ink` | `#000000` | Texto, botão principal, ícones |
| `--color-paper` | `#ffffff` | Fundo da página |
| `--color-surface` | `#f3f3f3` | Cards de filtro, resumo, endereço, pedido |
| `--color-card` | `#f6f6f6` | Fundo da imagem do produto |
| `--color-search` | `#eeeef5` | Busca e cards de comentário |
| `--color-field` | `#e8e8e8` | Campos de formulário |
| `--color-line` | `#d9d9d9` | Bordas, divisores, desabilitado |
| `--color-muted` | `#6b6b6b` | Texto secundário (contraste 5,3:1 no branco) |
| `--color-link` | `#026efb` | Links e ações textuais |
| `--color-star` | `#ff9924` | Estrelas e barras de avaliação |
| `--color-danger` | `#df3737` | Borda de erro, "Sair" |
| `--color-danger-text` | `#b42323` | Texto de erro e cancelado (contraste AA) |

Regra: o texto secundário usa `--color-muted`, **nunca** `#8e8e8e` (não passa no contraste).

### Tipografia

Fonte: **Inter** (Google Fonts, pesos 400, 500, 600, 700), carregada no `index.html`.

| Uso | Tamanho | Peso |
|---|---|---|
| Título de página (h1) | 32 px (mobile 28 px) | 700 |
| Hero | 48 px (mobile 32 px) | 700 |
| Título de seção (h2) | 24 px (mobile 20 px) | 700 |
| Título de card | 17 a 20 px | 600 a 700 |
| Corpo | 15 a 16 px | 400 a 500 |
| Secundário | 13 a 14 px | 400 a 500 |
| Logo (texto "HORIZONTE") | 20 px, espaçamento de letras `.14em` | 700 |

### Espaçamento, raios, sombras

- Base de 4 px. Escala em `--space-*` (1 = 4 px até 24 = 96 px).
- Raios: `--radius-sm` 8, `--radius-md` 12 (botões e campos), `--radius-lg` 16 (cards e imagens), `--radius-xl` 20 (painel do chat), `--radius-pill` 999 (chips, selos, avatares).
- Sombras só em dois lugares: botão flutuante do chat (`--shadow-fab`) e painel do chat (`--shadow-panel`).

### Layout

- Container: largura máxima **1200 px**, centralizado, margem lateral 16 px (mobile) ou 24 px (desktop).
- Alturas de controle: botão e campo **52 px** (grande) ou **44 px** (compacto). Área de toque mínima **44 px**.
- Header: 72 px.

### Breakpoints (CSS mobile-first)

| Faixa | Largura | Grade de produtos |
|---|---|---|
| Mobile | até 639 px | 2 colunas |
| Tablet | 640 a 1023 px | 3 colunas |
| Desktop | 1024 px ou mais | 4 colunas |

Escreva o CSS base para mobile e acrescente `@media (min-width: 640px)` e `@media (min-width: 1024px)`. Variáveis CSS não funcionam em media query: use os números direto.

### Foco e acessibilidade

- Foco visível: `outline: 2px solid var(--color-ink); outline-offset: 2px`.
- Texto normal com contraste mínimo de 4,5:1.
- Ícone sem texto sempre com `aria-label`.
- Nunca `div` ou `span` clicável: use `<button>` ou `<a>`.

## 3. Ícones e imagens

- Ícones: `lucide-react`, traço 1.8, 20 a 24 px. Mapa: favoritos `Heart`, cesta `ShoppingBag`, perfil `User`, busca `Search`, filtros `SlidersHorizontal`, nota `Star`, chat `MessageCircle`, enviar `Send`, fechar `X`, mais/menos `Plus`/`Minus`, voltar `ChevronLeft`, abrir seção `ChevronDown`, remover `Trash2`.
- Imagem de produto: proporção **4:5**, fundo `--color-card`, raio 16. Sem imagem: placeholder estilizado com ícone por categoria (Feminino/Masculino/Infantil = `Shirt`, Calçados = `Footprints`, Acessórios = `Watch`, Esporte = `Dumbbell`, Beleza = `Sparkles`, Casa = `House`, Moda praia = `Waves`), fundo derivado da cor do produto (`color-mix`) e contraste automático no ícone (`ProductImage`).
- Sem marcas reais, sem fotos de pessoas reais, sem hotlink de imagens externas.

## 4. Componentes base (`src/components/ui/`, dono: agente Design)

| Componente | Especificação |
|---|---|
| `Button` | Variantes `primary` (preto/branco), `outline` (branco, borda `--color-line`), `ghost` (sem fundo). Alturas 52 px e 44 px. Raio 12. Estado `disabled` com `--color-line`. Prop `fullWidth`. |
| `IconButton` | Círculo 44 px, ícone 22 px, fundo transparente, hover `--color-surface`. Exige `aria-label`. Variante com contador (selo preto 18 px no canto). |
| `Field` | `<label>` + campo 52 px, fundo `--color-field`, raio 12, sem borda, foco com anel preto. Mostra texto de ajuda e erro (`--color-danger-text`). Versão `readOnly` com fundo `--color-surface`. |
| `Checkbox`, `Radio` | 20 px, `accent-color` preto, dentro de `<label>`. |
| `Chip` | Pílula 36 a 40 px, borda `--color-line`, fundo branco. Selecionado: borda preta e fundo `--color-surface`. Usado em tamanhos e filtros ativos. |
| `ColorSwatch` | Círculo 36 px com borda `--color-line`. Selecionado: anel duplo (2 px branco + 2 px preto). `aria-pressed` e `aria-label` com o nome da cor. |
| `Badge` | Selo pílula 28 px. `ok` (preto, texto branco) para Finalizado e Padrão. `cancel` (branco, texto `--color-danger-text`, borda `--color-danger`). |
| `RatingPill` | Pílula branca com borda `#eee`, estrela e nota ("4.9"). |
| `Accordion` | `<details>` com título 17 px semibold, divisor superior, seta à direita. |
| `QuantityStepper` | Pílula 40 px com botões −/+ de 40 px e número no centro. |
| `Breadcrumb`, `Pagination` | Texto 14 px muted; paginação com quadrados 44 px (atual: preto). |
| `EmptyState` | Cartão `--color-surface`, título, frase curta e botão. |
| `ProductImage` | Imagem 4:5 com placeholder. |

## 5. Componentes de negócio (`src/components/`, dono: agente UI)

| Componente | O que mostra |
|---|---|
| `Header` | Logo, nav (Início, Catálogo, Favoritos), busca (máx. 420 px), ícones favoritos, cesta (com contador) e perfil. Linha inferior `#ececec`. Mobile: nav escondida em um menu (`<details>`), busca abaixo. |
| `Footer` | Linha de copyright centralizada, muted. |
| `ProductCard` | Imagem 4:5 com `FavoriteButton` no canto superior direito (40 px, branco, redondo). Abaixo: preço em negrito + `RatingPill` à direita, nome 15 px, categoria muted 14 px. |
| `FavoriteButton` | Coração vazio ou preenchido de preto. `aria-pressed`. |
| `FilterPanel` | Cards cinza: Preço (mínimo e máximo), Tamanho (chips), Categoria (checkboxes). Botões "Limpar todos" e "Aplicar". **Sem filtro de cor, marca ou estilo.** Desktop: coluna lateral de 280 px. Mobile: tela cheia aberta por botão "Filtrar". |
| `ReviewCard` | Fundo `--color-search`, avatar redondo, nome, data, `RatingPill`, texto, "Ler mais" em `--color-link`. |
| `AddressCard` | Fundo `--color-surface`, apelido, selo "Padrão", linhas de endereço, ações Editar, Remover, Definir padrão. |
| `OrderCard` | Número, data, `Badge` de status, miniaturas, total, "Ver detalhes". |
| `CartItem` | Miniatura 110×138, nome, "Tamanho: M · Cor: Preto", `QuantityStepper`, preço, "Remover". |
| `OrderSummary` | Cartão `--color-surface`: Subtotal, Frete (simulado), Total grande, botão principal. Texto "Compra simulada: nenhum pagamento real é feito." |
| `ChatWidget` | Botão flutuante preto 60 px (canto inferior direito, 32 px de margem). Abre painel 400×640 (mobile: tela cheia): cabeçalho preto, mensagens (assistente em `--color-surface` à esquerda, usuário em preto à direita), sugestões em chips, campo + botão enviar. |

## 6. Telas

Todas usam `Header` e `Footer`, exceto Login e Checkout (cabeçalho simplificado com passos).

| Rota | Tela | Estrutura |
|---|---|---|
| `/login` | Login | Desktop: metade foto/placeholder escuro com slogan, metade formulário (e-mail, senha, "Esqueceu sua senha?", Entrar, Continuar com Google, Cadastrar-se). Recuperar senha: bloco com e-mail e "Enviar link" (o Firebase envia um **link**, não código). Mobile: só o formulário. |
| `/` | Home | Hero escuro com slogan e botão "Ver catálogo"; "Categorias em destaque" (círculos 140 px); "Vistos recentemente" (grade de `ProductCard`, guardado no `localStorage`). |
| `/catalogo` | Catálogo | Título + contagem de produtos; `FilterPanel` à esquerda; chips dos filtros ativos, "Ordenar por" e grade; paginação. Aceita `?busca=` e `?categoria=`. |
| `/produto/:id` | Produto | Galeria (miniaturas + imagem principal 4:5) e coluna de detalhes: categoria, nome, nota, preço, **Cores** (`ColorSwatch`), **Tamanho** (`Chip`; em calçados, numeração 34 a 44), "Adicionar à cesta" + coração, acordeões Descrição, Materiais, Entrega. Abaixo: Comentários (resumo da nota + `ReviewCard`) e Produtos semelhantes. Exige escolher tamanho e cor antes de adicionar. |
| `/favoritos` | Favoritos | Grade de `ProductCard` com coração preenchido; botão "Escolher tamanho" abaixo de cada um; `EmptyState` se vazio. |
| `/carrinho` | Cesta | Lista de `CartItem` + `OrderSummary` à direita (desktop) ou abaixo (mobile). Link "Continuar comprando". |
| `/checkout` | Checkout simulado | Passos (Cesta, Entrega e pagamento, Confirmação). Cartão de endereços salvos (rádio) com "Adicionar novo" e "Gerenciar"; cartão de pagamento (Pix, Cartão, Boleto, só simulação); `OrderSummary` com "Confirmar pedido". |
| `/perfil` | Perfil | Menu lateral (Perfil, Meus pedidos, Favoritos, Sair). Dados pessoais (nome, e-mail somente leitura, telefone). Seção "Meus endereços" com `AddressCard` e formulário de novo endereço (apelido, CEP, rua, número, complemento, bairro, cidade, UF, "usar como padrão"). |
| `/pedidos` | Meus pedidos | Mesmo menu lateral; lista de `OrderCard`. |

Telas privadas (exigem login): Favoritos, Carrinho, Checkout, Perfil, Pedidos. Sem login, redirecionar para `/login` e voltar à rota de origem depois.

## 7. Estados que toda tela precisa

- **Carregando:** blocos cinza (`--color-surface`) no lugar do conteúdo, sem spinner.
- **Erro:** frase curta ("Não foi possível carregar. Tente novamente.") + botão "Tentar de novo".
- **Vazio:** `EmptyState` com próxima ação.
- **Sucesso de formulário:** mensagem curta abaixo do botão, sem pop-up.

## 8. CSS Modules: como escrever

```css
/* ProductCard.module.css */
.card { position: relative; }
.image { aspect-ratio: 4 / 5; border-radius: var(--radius-lg); background: var(--color-card); }
.price { font-size: var(--fs-lg); font-weight: var(--fw-bold); }
@media (min-width: 1024px) {
  .price { font-size: var(--fs-xl); }
}
```

Proibido: `#hex` e valores em `px` de espaçamento fora de `tokens.css`, `!important`, estilo inline (exceto valor dinâmico vindo de props), seletor de tag fora de `src/styles/`.

## 9. Checklist visual (agente Revisor)

- Cores, raios e tamanhos vêm de tokens.
- Botão principal preto; links azuis só para ação textual.
- Nenhuma rolagem horizontal em 390, 768 e 1440 px.
- Grade com 2, 3 e 4 colunas nas faixas certas.
- Alvos de toque de 44 px ou mais.
- Foco visível ao navegar com Tab.
- Imagem sem marca real.
