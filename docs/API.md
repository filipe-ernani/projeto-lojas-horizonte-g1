# API.md — Contrato de dados (PROVISÓRIO)

> **Provisório** até o dataset e o back-end ficarem prontos. O front usa estes formatos; os mocks em `src/mocks/` seguem exatamente isto. Se o contrato mudar, atualize **este arquivo primeiro**, depois os mocks e `src/api/`.
> Regra para agentes: só use rotas e campos que estão aqui. Faltou algo? Pergunte ao Caio e registre em `docs/DECISIONS.md`.

Base: `VITE_API_URL` (ex.: `http://localhost:3000`). JSON em **camelCase**. Valores monetários em **número** (reais, ex.: `520` ou `89.9`), formatados no front com `formatCurrency`.

Rotas privadas exigem o cabeçalho `Authorization: Bearer <ID Token do Firebase>`. O front **nunca** envia `usuarioId`: o back obtém pelo token.

## Formatos

```js
// Produto
{ id: 12, nome: "Jaqueta Acolchoada Oversized", descricao: "…", categoria: "Jaquetas",
  preco: 520, imagemUrl: null,            // null => placeholder
  tamanhos: ["PP","P","M","G","GG"],      // calçados: ["34","35",…,"44"]
  cores: [{ nome: "Preto", hex: "#000000" }],
  notaMedia: 4.9, qtdAvaliacoes: 108, estoque: 14 }

// Avaliação
{ id: 1, produtoId: 12, autor: "Júlia", nota: 5, comentario: "…", data: "2026-11-12" }

// Endereço
{ id: 3, apelido: "Casa", cep: "01000-000", logradouro: "Rua das Flores", numero: "123",
  complemento: "Apto 45", bairro: "Centro", cidade: "São Paulo", uf: "SP", padrao: true }

// Carrinho
{ itens: [{ produtoId: 12, nome: "…", preco: 520, imagemUrl: null,
            tamanho: "M", cor: "Preto", quantidade: 1 }],
  subtotal: 700, frete: 0, total: 700 }

// Pedido
{ id: 1042, data: "2026-11-13", status: "FINALIZADO",   // ou "CANCELADO"
  total: 700, qtdItens: 3, itens: [ /* como no carrinho */ ], enderecoResumo: "São Paulo/SP" }
```

## Rotas

| Método | Rota | Acesso | Corpo / parâmetros | Resposta |
|---|---|---|---|---|
| GET | `/api/categorias` | público | — | `["Jaquetas", "Camisetas", …]` |
| GET | `/api/produtos` | público | `categoria`, `busca`, `tamanho`, `precoMin`, `precoMax`, `pagina`, `limite`, `ordenar` (`relevancia`, `menor-preco`, `maior-preco`, `melhor-avaliados`) | `{ itens: Produto[], total, pagina, limite }` |
| GET | `/api/produtos/:id` | público | — | `Produto` |
| GET | `/api/produtos/:id/avaliacoes` | público | — | `{ resumo: { notaMedia, total, distribuicao: {5:…,4:…,3:…,2:…,1:…} }, itens: Avaliacao[] }` |
| GET | `/api/produtos/:id/semelhantes` | público | — | `Produto[]` (até 4) |
| GET | `/api/favoritos` | privado | — | `Produto[]` |
| PUT | `/api/favoritos/:produtoId` | privado | — | `204` |
| DELETE | `/api/favoritos/:produtoId` | privado | — | `204` |
| GET | `/api/usuarios/perfil` | privado | — | `{ nome, email, telefone }` |
| PUT | `/api/usuarios/perfil` | privado | `{ nome, telefone }` | `{ nome, email, telefone }` (também cria o usuário no primeiro login) |
| GET | `/api/enderecos` | privado | — | `Endereco[]` |
| POST | `/api/enderecos` | privado | `Endereco` sem `id` | `Endereco` |
| PUT | `/api/enderecos/:id` | privado | campos do `Endereco` | `Endereco` |
| DELETE | `/api/enderecos/:id` | privado | — | `204` |
| GET | `/api/carrinho` | privado | — | `Carrinho` |
| PUT | `/api/carrinho` | privado | `{ itens: [{ produtoId, tamanho, cor, quantidade }], ultimaEtapa }` (`CARRINHO` ou `CHECKOUT_INICIADO`) | `Carrinho` |
| POST | `/api/carrinho/finalizar` | privado | `{ enderecoId, formaPagamento }` (`PIX`, `CARTAO`, `BOLETO`) | `Pedido` |
| GET | `/api/pedidos/meus` | privado | — | `Pedido[]` |
| POST | `/api/chat` | privado | `{ mensagem, sessaoId }` | `{ resposta }` |

O preço e o total são **sempre calculados pelo servidor**; o front só exibe.

## Erros

Resposta de erro: `{ erro: "mensagem curta em português" }` com status HTTP adequado (`400`, `401`, `404`, `409` para estoque insuficiente, `500`). O front mostra a mensagem do campo `erro` quando existir.

## Mock

Com `VITE_USE_MOCK=true`, `src/api/` lê de `src/mocks/*.json`, simula 300 ms de atraso e guarda favoritos, carrinho, endereços e pedidos em `localStorage` (chave `horizonte-mock-*`), para a demo funcionar sem back-end.
