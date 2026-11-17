# API.md — Contrato de dados (PROVISÓRIO)

> **Provisório** até o dataset e o back-end ficarem prontos. Não há mocks: o front só liga estes formatos quando a API existir. Se o contrato mudar, atualize **este arquivo primeiro**, depois `src/api/`.
> Regra para agentes: só use rotas e campos que estão aqui. Faltou algo? Pergunte ao Caio e registre em `docs/DECISIONS.md`.

Base: `VITE_API_URL` (ex.: `http://localhost:3000`). JSON em **camelCase**. Valores monetários em **número** (reais, ex.: `520` ou `89.9`), formatados no front com `formatCurrency`.

Rotas privadas exigem o cabeçalho `Authorization: Bearer <ID Token do Firebase>`. O front **nunca** envia `usuarioId`: o back obtém pelo token.

## Formatos

> **Catálogo e dados de produtos:** o catálogo de produtos vem de `data/catalogo.csv` (200 produtos, 9 categorias: Feminino, Masculino, Infantil, Calçados, Moda íntima e praia, Acessórios, Esporte, Beleza, Casa). Tamanhos, cores e descrições são derivados no script de seed (`npm run seed:simulado`), marcados com origem `SIMULADO`. O campo de estoque está fora do escopo do MVP (D-21).

```js
// Produto (D-21 e D-22: id é o sku; estoque fora do escopo; tamanhos, cores e descrição gerados como SIMULADO)
{ id: "HZ-FEM-001", sku: "HZ-FEM-001", nome: "Short Feminino Viscose Marrom", modelo: "Short Feminino Viscose", descricao: "…", categoria: "Feminino",
  preco: 26.90, imagemUrl: null,            // null => placeholder nativo
  tamanhos: ["PP","P","M","G","GG"],        // calçados: ["34"…"44"]; Acessórios/Casa/Beleza: ["Único"]
  cores: [{ nome: "Marrom", hex: "#6B4E3D" }], // Beleza: [] (sem cor)
  notaMedia: null, qtdAvaliacoes: 0 }       // sem avaliações fictícias (D-19)

// Avaliação (resumo neutro quando não houver avaliações reais)
{ resumo: { notaMedia: null, total: 0, distribuicao: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }, itens: [] }

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
| GET | `/api/categorias` | público | — | `["Acessórios", "Beleza", "Calçados", "Casa", "Esporte", "Feminino", "Infantil", "Masculino", "Moda íntima e praia"]` |
| GET | `/api/produtos` | público | `categoria`, `busca`, `tamanho`, `precoMin`, `precoMax`, `pagina`, `limite`, `ordenar` (`relevancia`, `menor-preco`, `maior-preco`, `recentes`, `melhor-avaliados`) | `{ itens: Produto[], total, pagina, limite }` |
| GET | `/api/produtos/:id` | público | `:id = sku` (D-22) | `Produto` |
| GET | `/api/produtos/:id/avaliacoes` | público | `:id = sku` (D-22) | `{ resumo: { notaMedia: null, total: 0, distribuicao: {5:0,4:0,3:0,2:0,1:0} }, itens: [] }` |
| GET | `/api/produtos/:id/semelhantes` | público | `:id = sku` (D-22) | `Produto[]` (até 4 da mesma categoria) |
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

Resposta de erro: `{ erro: "mensagem curta em português" }` com status HTTP adequado (`400`, `401`, `404`, `500`). O front mostra a mensagem do campo `erro` quando existir.

## Sem mock

Não existem dados de exemplo no front. Sem back-end, as telas de dados mostram o estado de erro ou vazio. Quando o dataset e a API estiverem prontos, este contrato é revisado antes de qualquer `src/api/` de recurso.
