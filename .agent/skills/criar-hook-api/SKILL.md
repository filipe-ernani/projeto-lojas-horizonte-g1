---
name: criar-hook-api
description: Cria a camada de dados de uma funcionalidade do Horizonte (função em src/api, hook e, se preciso, Context). Use só quando o Caio pedir e o contrato do recurso estiver confirmado. Sem mocks.
---

# Criar camada de dados

**Sem dados mockados.** Só use esta skill quando o Caio pedir e o recurso estiver no `docs/API.md` confirmado. Ordem: **contrato, api, hook, (context)**.

## 1. Contrato
Confirme a rota e o formato em `docs/API.md`. Não existe ou está incerto? Pare e pergunte ao Caio. Mudou algo? Atualize `docs/API.md` **primeiro**.

## 2. Função em `src/api/<nome>.js`
```js
import { request } from "./client";

export function listarFavoritos() {
  return request("/api/favoritos");
}
```
- `request` (em `client.js`) usa `VITE_API_URL`, coloca o `Authorization` quando houver usuário, lê o campo `erro` das falhas e devolve o JSON.
- Uma função por rota do contrato. Verbo em português: `listar`, `buscar`, `criar`, `atualizar`, `remover`.
- Nunca envie `usuarioId`, preço ou total.

## 3. Hook em `src/hooks/useNome.js`
```js
import { useEffect, useState } from "react";
import { listarFavoritos } from "@/api/favoritos";

export default function useFavoritos() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  function carregar() {
    setCarregando(true);
    setErro(null);
    listarFavoritos()
      .then(setDados)
      .catch((e) => setErro(e.message))
      .finally(() => setCarregando(false));
  }

  useEffect(carregar, []);

  return { dados, carregando, erro, recarregar: carregar };
}
```
Sempre devolva `{ dados, carregando, erro, recarregar }`.

## 4. Context (só se vários componentes precisam do mesmo estado)
Apenas `AuthContext`, `CartContext` e `FavoritesContext`. O contexto expõe estado e ações (ex.: `adicionar`, `remover`). Atualize o estado local primeiro e confirme com a API; se falhar, desfaça e mostre erro.

## Depois
1. `npm run lint`.
2. Sem back-end, o teste é ver que o estado de **erro** aparece corretamente na tela. Com back-end, teste sucesso, vazio e erro.
3. `/handoff` (com a sugestão de commit) e `/explicar`.
