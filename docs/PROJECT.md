# PROJECT.md — Contexto do projeto

## O que é

Projeto Integrador do Academy (IPNET by VIVO). O Grupo 1 é uma squad contratada pela **Lojas Horizonte**, rede de moda com 12 lojas físicas e e-commerce em crescimento. O squad entrega um MVP orientado a dados e IA e a arquitetura conceitual no GCP. **Entrega e apresentação: 23/11.** Congelamento de código: **20/11**.

Dores do cliente: instabilidade em picos (Black Friday), dados fragmentados, abandono de carrinho sem análise, falta de personalização (recomendação e suporte automatizado).

## Minha frente (Caio, Full Stack)

Aplicação web de e-commerce que resolve essas dores e integra o squad:

- **Front-end** (este repositório): React + Vite, JSX, CSS Modules.
- **Login:** Firebase Auth (Google e e-mail/senha).
- **Back-end** (outro repositório): Node + Express + PostgreSQL em Docker, com catálogo vindo do dataset Olist tratado pelo Diego (Dados).
- **Chat com a IA:** widget no front, rota `/api/chat` no back, agente ADK do Emanuel (IA).
- **Integração:** endpoints para o Diego e o Henry (BI) consumirem pedidos e carrinhos abandonados.

## Escopo do front-end

Telas: Login (com recuperar senha), Home, Catálogo com filtros e busca, Produto, Favoritos, Carrinho, Checkout simulado, Perfil (com endereços), Meus pedidos, Chat com a IA. Detalhes em `docs/DESIGN.md`.

Regras de negócio já decididas:

- Filtros do catálogo: **preço, tamanho, categoria**. Sem filtro de cor, marca ou estilo.
- Página do produto: escolher **tamanho** (número do calçado, se for sapato) e **cor** antes de adicionar à cesta.
- **Favoritos** (coração) existem e exigem login.
- Carrinho e checkout exigem login. O checkout é **simulado** (nenhum pagamento real).
- O usuário pode ter **vários endereços** salvos; escolhe um no checkout.
- Evento de carrinho abandonado: o carrinho ativo parado por um tempo é considerado abandonado (cálculo no back-end).

## Fora do escopo

Pagamento real, cadastro de produtos pelo lojista, painel administrativo, cupons, rastreio de entrega, avaliações escritas pelo cliente, login com Apple e Facebook, aplicativo nativo.

## Dados

O dataset (Olist, tratado pelo Diego) **ainda não chegou**. Até lá o front usa mocks em `src/mocks/` no formato de `docs/API.md`. Quando o dataset chegar, ajustamos o contrato e trocamos `VITE_USE_MOCK` para `false`.

## Equipe

| Pessoa | Papel |
|---|---|
| Caio | Full Stack (este front-end e o back-end) |
| Diego | Engenharia de Dados (Databricks, pipeline Medallion, catálogo) |
| Emanuel | Engenharia de IA (agente ADK, RAG lexical) |
| Henry | BI (dashboard no Databricks) |
| Filipe | PMO (backlog, riscos, relatório diário) |
