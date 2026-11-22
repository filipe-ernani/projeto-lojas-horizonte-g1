---
name: criar-pagina
description: Cria uma página (tela) do Horizonte seguindo docs/DESIGN.md, com rota, estados de carregando/erro/vazio e responsivo. Use ao implementar qualquer tela de src/pages.
---

# Criar página

## Antes
1. Leia a linha da tela na tabela "Telas" e as seções de componentes em `docs/DESIGN.md`.
2. Veja quais dados a tela precisa e se já existe hook em `src/hooks/`. **Sem back-end ainda e sem mocks:** construa a página com a estrutura completa e os estados (carregando, erro, vazio), e os componentes recebendo dados **por props**. Não invente dados. Quando o recurso existir, o agente Dados cria o hook e só se liga à página.
3. Veja quais componentes já existem em `components/ui/` e `components/`.

## Estrutura
```
src/pages/Catalogo/
  Catalogo.jsx
  Catalogo.module.css
```
A rota é registrada em `src/routes/AppRoutes.jsx`. Telas privadas (favoritos, carrinho, checkout, perfil, pedidos) ficam dentro de `PrivateRoute`.

## Receita
- A página **compõe** componentes e hooks. Lógica de dados fica no hook; regra visual fica no componente.
- Cabeçalho e rodapé vêm de um layout compartilhado (`Header` e `Footer`), exceto Login e Checkout.
- Conteúdo dentro de `<main>` com a classe global `container`. Um único `<h1>` por página.
- Trate sempre os três estados:
  - **carregando:** blocos cinza no lugar do conteúdo;
  - **erro:** frase curta e botão "Tentar de novo";
  - **vazio:** `EmptyState` com próxima ação.
- Filtros e paginação do catálogo ficam na URL (`?categoria=&busca=&pagina=`), usando `useSearchParams`. Assim o botão "voltar" funciona.
- Responsivo: layout em coluna no mobile; duas colunas (`flex-wrap`) no desktop. Grade de produtos com a classe global `.product-grid`.

## Depois
1. `npm run lint` e `npm run build`.
2. Abra em 390, 768 e 1440 px e force os estados carregando, erro e vazio.
3. Rode `/revisar`, `/explicar` e `/handoff`.
