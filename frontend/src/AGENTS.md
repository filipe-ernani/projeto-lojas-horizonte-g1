# AGENTS.md — Horizonte (front-end)

Projeto: e-commerce de moda **Lojas Horizonte** (Projeto Integrador, IPNET by VIVO, entrega 23/11).
Este repositório é o **front-end**: React + Vite, **JSX** (não TypeScript), **CSS Modules**.

**Idioma:** responda, comente e nomeie mensagens de commit em **português do Brasil**. Nomes de código (componentes, funções) em inglês ou português, mas sem misturar no mesmo arquivo.

## Quem é o desenvolvedor

O Caio está aprendendo enquanto constrói. Por isso:
- Prefira a solução **mais simples** que funciona. Nada de abstração "para o futuro".
- Depois de cada tarefa, explique em linguagem simples o que foi feito e por quê (workflow `/explicar`). Um conceito novo por vez.
- Se houver mais de um caminho razoável, proponha o mais simples e diga o que mudaria no outro.

## Antes de qualquer tarefa

1. Leia `docs/STATUS.md` (onde paramos) e `docs/DECISIONS.md` (o que já foi decidido).
2. Mexeu em tela ou estilo? Leia `docs/DESIGN.md`. Mexeu em dados? Leia `docs/API.md`.
3. Faltou informação nesses arquivos? **Pergunte ao Caio.** Não invente rota, campo, cor, texto de negócio ou biblioteca.

## Stack (lista fechada)

| Uso | Ferramenta |
|---|---|
| Base | React + Vite (JSX) |
| Rotas | `react-router-dom` |
| Login | `firebase` (Auth: Google e e-mail/senha) |
| Estilo | CSS Modules + `src/styles/tokens.css` |
| Ícones | `lucide-react` |
| Dados | `fetch` nativo, `useState`, `useEffect`, Context API, hooks próprios |
| Qualidade | ESLint (do template do Vite) |

**Proibido adicionar dependência sem aprovação do Caio.** Isso inclui Tailwind, UI kits, Zod, TanStack Query, axios, Redux e similares.

## Comandos

```bash
npm install
npm run dev      # servidor local
npm run lint     # ESLint
npm run build    # build de produção
```

## Estrutura e donos (cada agente só edita as próprias pastas)

```
src/
  api/            # funções que falam com a API (fetch)               -> Dados
  context/        # AuthContext, CartContext, FavoritesContext         -> Dados
  hooks/          # useProducts, useFavorites, ...                     -> Dados
  utils/          # formatCurrency, formatDate                         -> Dados
  firebase.js     # configuração do Firebase (lê o .env)               -> Dados
  styles/         # tokens.css, reset.css, global.css                  -> Design
  components/ui/  # Button, Input, Chip, Badge, ... (base visual)      -> Design
  components/     # ProductCard, Header, ChatWidget, ... (de negócio)  -> UI
  pages/          # uma pasta por tela                                 -> UI
  routes/         # AppRoutes, PrivateRoute                            -> UI
docs/             # contexto do projeto (ver abaixo)
.agent/           # rules, workflows e skills
```

Precisa mexer na pasta de outro agente? **Não edite.** Registre o pedido em `docs/STATUS.md` (seção "Pedidos entre agentes") e avise o Caio.

## Convenções de código

- Componentes de função, um por arquivo: `Componente.jsx` + `Componente.module.css` na mesma pasta.
- Classes CSS em camelCase (`styles.cardTitle`). Combine classes com template string, sem biblioteca.
- **Nunca** escreva cor, espaçamento, raio ou fonte soltos no CSS: use `var(--token)` de `tokens.css`.
- Todo acesso a dados passa por `src/api/`. Componente de página não chama `fetch` direto.
- Toda tela que busca dados trata **carregando**, **erro** e **vazio**.
- Acessibilidade: botões reais (`<button>`), `<label>` nos campos, `aria-label` em botão só com ícone, foco visível.
- Dinheiro sempre via `formatCurrency` (BRL). Nada de `toFixed` espalhado.
- Sem `console.log` esquecido, sem código comentado, sem arquivos sem uso.

## Dados: sem mock

**Não usamos dados mockados.** O dataset (Olist, tratado por outro integrante) e o back-end ainda não existem, e o Caio vai esperar por eles. Por isso:

- **Proibido** criar `src/mocks/`, JSON de exemplo, listas de produtos inventadas ou `localStorage` simulando back-end.
- O que **não depende de back-end** é feito já: componentes, layout, rotas, login com Firebase.
- Telas de dados (catálogo, produto, favoritos, carrinho...) são construídas com **estrutura e estados** (carregando, erro, vazio). Sem API, elas mostram erro ou vazio, e isso é esperado.
- Componentes recebem dados **por props**. Quando houver API, só se liga o hook à página.
- Para ver um componente com conteúdo, o Caio pode pedir uma página de teste (`src/pages/_Teste`) com props escritas na hora, descartada depois. Isso não vira dado do app.
- `docs/API.md` é o contrato **provisório**. Será confirmado quando o dataset chegar. Até lá, não escreva `src/api/` de recurso que o Caio não pediu.

## Segredos e arquivos sensíveis (`.gitignore`)

- Nunca versionar `.env`, chaves, tokens, credenciais ou dados pessoais. Só `.env.example`, sem valores.
- O `.gitignore` **sempre** cobre: `.env` e `.env.*` (menos `.env.example`), `*-firebase-adminsdk-*.json`, `serviceAccount*.json`, `*.pem`, `*.key`, `.firebase/`, logs, `node_modules` e `dist`.
- Ao criar ou receber **qualquer** arquivo com senha, chave, token, credencial ou dado pessoal, a **primeira ação** é colocá-lo no `.gitignore` e avisar o Caio.
- Antes de sugerir um commit, rode `git status` e confirme que nenhum arquivo sensível aparece. Se aparecer, pare e avise.
- Se um segredo já foi commitado: avise na hora. A chave precisa ser **revogada e trocada**; apagar do histórico não basta.

## Git e commits

- **O agente nunca roda `git commit` nem `git push`.** Quem commita é o Caio. O trabalho do agente é entregar a **sugestão de commit** pronta.
- Ao fim de **cada tarefa concluída** (um componente, uma tela, uma camada de dados), o `/handoff` termina com a sugestão de commit e o registro do que foi feito em `docs/STATUS.md`.
- **Um commit por tarefa**, pequeno e com uma única finalidade. Não misture duas features.
- Uma branch por feature: `feat/<nome>` (ex.: `feat/catalogo`).
- Mensagem em português, no imperativo:

```
tipo(escopo): resumo curto, até 72 caracteres

- o que mudou
- por que, se não for óbvio
```

Tipos: `feat` (funcionalidade), `fix` (correção), `style` (visual), `refactor`, `docs`, `chore` (config, dependência). Escopo: a área (`ui`, `catalogo`, `produto`, `api`, `auth`, `carrinho`…).

- A sugestão vem com os comandos e `git add` **de arquivos específicos** (nunca `git add .`):

```bash
git status
git add src/components/ui/Button docs/STATUS.md
git commit -m "feat(ui): cria componente Button com variantes e tamanhos"
```

## Imagens e marcas

Sem marcas reais, logotipos de terceiros ou fotos de pessoas reais. Produto sem imagem usa o placeholder do componente `ProductImage`.

## Definição de pronto

Uma tarefa só termina quando:
1. `npm run lint` passa sem erro.
2. `npm run build` passa.
3. A tela funciona em **1440 px, 768 px e 390 px** de largura (sem rolagem horizontal).
4. Visual conferido contra `docs/DESIGN.md`.
5. `docs/STATUS.md` atualizado (workflow `/handoff`).
6. Sugestão de commit entregue (mensagem e comandos) e `git status` sem arquivo sensível.

## Fim de cada sessão

Rode o workflow `/handoff`. Ele atualiza `docs/STATUS.md` com o que foi feito, o que ficou quebrado e o próximo passo, e entrega a **sugestão de commit**. Na próxima sessão, `/retomar` lê esse arquivo e continua de onde parou.

## Mapa dos documentos

| Arquivo | Para quê |
|---|---|
| `docs/PROJECT.md` | Contexto, escopo e telas |
| `docs/DESIGN.md` | Design system e telas |
| `docs/API.md` | Contrato de dados (provisório até chegar o dataset) |
| `docs/DECISIONS.md` | Decisões já tomadas |
| `docs/STATUS.md` | Onde paramos e o que falta |
| `docs/agentes/` | Papéis dos agentes |
| `.agent/rules/` | Regras detalhadas |
| `.agent/workflows/` | `/nova-feature`, `/handoff`, `/retomar`, `/revisar`, `/explicar` |
| `.agent/skills/` | Receitas: criar componente, página, camada de dados |
