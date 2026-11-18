# API.md — Contrato de dados (PROVISÓRIO)

> **Provisório** até o dataset e o back-end ficarem prontos. Não há mocks: o front só liga estes formatos quando a API existir. Se o contrato mudar, atualize **este arquivo primeiro**, depois `src/api/`.
> Regra para agentes: só use rotas e campos que estão aqui. Faltou algo? Pergunte ao Caio e registre em `docs/DECISIONS.md`.

Base: `VITE_API_URL` (ex.: `http://localhost:3000`). JSON em **camelCase**. Valores monetários em **número** (reais, ex.: `520` ou `89.9`), formatados no front com `formatCurrency`.

Rotas privadas exigem o cabeçalho `Authorization: Bearer <ID Token do Firebase>`. O front **nunca** envia `usuarioId`: o back obtém pelo token. Tokens sintéticos `test:`/`mock:` só valem com `ALLOW_TEST_TOKENS=true` e `NODE_ENV` diferente de `production`; o padrão é desligado.

**CORS:** só são aceitas as origens listadas em `FRONT_ORIGIN` (separadas por vírgula; padrão `http://localhost:5173`). Outra origem recebe `403`; requisição sem cabeçalho `Origin` é permitida. Em produção, a origem pública do site precisa estar nessa lista.

**Limite de requisições (por IP, em memória):** `/api/chat` 30/min e `/api/integracao` 60/min. Acima disso a resposta é `429` com o cabeçalho `Retry-After`.

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

// Carrinho (frete fixo simulado D-27; produtoId é o sku; preco é sempre o preço atual do produto, D7)
{ itens: [{ produtoId: "HZ-FEM-001", nome: "…", preco: 26.9, imagemUrl: null,
            tamanho: "M", cor: "Marrom", corHex: "#6B4E3D", quantidade: 1 }], // corHex: null se não houver
  subtotal: 26.9, frete: 15.0, total: 41.9 }

// Pedido
{ id: 1042, data: "2026-11-17", status: "FINALIZADO",   // ou "CANCELADO"
  formaPagamento: "CARTAO_CREDITO",                     // PIX, CARTAO_CREDITO ou CARTAO_DEBITO
  parcelas: 3,                                          // 1 fora do crédito
  valorParcela: 13.97,                                  // só no crédito: sem juros, arredondada para cima ao centavo
  total: 41.9, qtdItens: 1, itens: [ /* como no carrinho, com corHex */ ], enderecoResumo: "São Paulo/SP" }

// Pix SIMULADO: vem somente na resposta de POST /api/carrinho/finalizar com formaPagamento PIX
{ /* campos do Pedido */
  pix: { chave: "pix.simulado@lojashorizonte.example", codigoCopiaECola: "SIMULADO-…",
         expiraEm: "2026-11-17T12:30:00.000Z", origem: "SIMULADO" } }
```

## Rotas

| Método | Rota | Acesso | Corpo / parâmetros | Resposta |
|---|---|---|---|---|
| GET | `/api/categorias` | público | — | `["Acessórios", "Beleza", "Calçados", "Casa", "Esporte", "Feminino", "Infantil", "Masculino", "Moda íntima e praia"]` |
| GET | `/api/produtos` | público | `categoria`, `busca`, `tamanho`, `precoMin`, `precoMax`, `pagina`, `limite`, `ordenar` (`relevancia`, `menor-preco`, `maior-preco`, `recentes`, `novidades`, `melhor-avaliados`) | `{ itens: Produto[], total, pagina, limite }` |
| GET | `/api/produtos/:id` | público | `:id = sku` (D-22) | `Produto` |
| GET | `/api/produtos/:id/avaliacoes` | público | `:id = sku` (D-22) | `{ resumo: { notaMedia: null, total: 0, distribuicao: {5:0,4:0,3:0,2:0,1:0} }, itens: [] }` |
| GET | `/api/produtos/:id/semelhantes` | público | `:id = sku` (D-22) | `Produto[]` (até 4 da mesma categoria) |
| GET | `/api/favoritos` | privado | — | `Produto[]`, cada um com `corHex` (hex da primeira cor do produto ou `null`) |
| PUT | `/api/favoritos/:produtoId` | privado | — | `204` |
| DELETE | `/api/favoritos/:produtoId` | privado | — | `204` |
| GET | `/api/usuarios/perfil` | privado | — | `{ nome, email, telefone }` |
| PUT | `/api/usuarios/perfil` | privado | `{ nome, telefone }` | `{ nome, email, telefone }` (também cria o usuário no primeiro login) |
| GET | `/api/enderecos` | privado | — | `Endereco[]` |
| POST | `/api/enderecos` | privado | `Endereco` sem `id` | `Endereco` |
| PUT | `/api/enderecos/:id` | privado | campos do `Endereco` | `Endereco` |
| DELETE | `/api/enderecos/:id` | privado | — | `204` |
| GET | `/api/carrinho` | privado | — | `Carrinho` |
| PUT | `/api/carrinho` | privado | `{ itens: [{ produtoId, tamanho, cor, quantidade }], ultimaEtapa }` (`CARRINHO` ou `CHECKOUT_INICIADO`). `itens` é obrigatório; só `[]` esvazia a cesta | `Carrinho` (`400` se `itens` faltar ou não for lista) |
| POST | `/api/checkout/iniciado` | privado | sem corpo; exige `X-Sessao-Id` | `204` (`400` sem sessão válida ou com a cesta vazia) |
| POST | `/api/carrinho/finalizar` | privado | `{ enderecoId, formaPagamento, parcelas? }`. `formaPagamento`: `PIX`, `CARTAO_CREDITO` ou `CARTAO_DEBITO` (`BOLETO` é recusado). `parcelas`: 1 a 12, só no crédito, sem juros. Dados de cartão são ignorados | `201` com `Pedido` (mais `pix` quando for Pix); `400` em pagamento inválido |
| GET | `/api/pedidos/meus` | privado | — | `Pedido[]` |
| POST | `/api/pedidos/:id/cancelar` | privado | — | `{ ok: true, id, status: "CANCELADO" }` (409 se já cancelado) |
| POST | `/api/chat` | privado | `{ mensagem, sessaoId }` | `{ resposta }` (timeout 20s, 20 msg/min, D-28) |
| GET | `/api/integracao/pedidos` | X-API-Key | `desde` (ISO UTC), `limite` (padrão 5000, máx 20000), `formato` (`csv`) | `{ itens, proximoDesde }` ou CSV |
| GET | `/api/integracao/pedido-itens` | X-API-Key | `desde` (ISO UTC), `limite` (padrão 5000, máx 20000), `formato` (`csv`) | `{ itens, proximoDesde }` ou CSV |
| GET | `/api/integracao/eventos` | X-API-Key | `desde` (ISO UTC), `limite` (padrão 5000, máx 20000), `formato` (`csv`) | `{ itens, proximoDesde }` ou CSV |

O preço e o total são **sempre calculados pelo servidor**; o front só exibe. A finalização cobra o preço atual do banco (D7).

**Integração (`/api/integracao/*`):** responde `401` sem `X-API-Key` válida e `400` quando `desde` não é uma data ISO 8601 existente (ex.: `2026-01-31T12:00:00Z`) ou quando `limite` não é um inteiro de 1 a 20000.

**Catálogo (`GET /api/produtos`):** responde `400` para `pagina` ou `limite` que não sejam inteiros positivos, `precoMin`/`precoMax` que não sejam números maiores ou iguais a zero, `precoMin` maior que `precoMax`, `ordenar` fora da lista e texto com caractere nulo. `limite` acima de 48 é reduzido para 48.

## Eventos de Analytics (D-23)

Gravados **exclusivamente pelo back-end** em `loja.analytics_eventos` quando o cabeçalho `X-Sessao-Id` (UUID válido) for enviado pelo front-end:
- `session_start`: gerado na primeira ocorrência da sessão.
- `view_product`: gerado ao consultar `GET /api/produtos/:id` com sucesso.
- `add_to_cart`: gerado ao aumentar a quantidade de uma variação (sku + tamanho + cor) em `PUT /api/carrinho`.
- `begin_checkout`: gerado uma vez por sessão em `POST /api/checkout/iniciado` ou ao transicionar `ultimaEtapa` para `CHECKOUT_INICIADO` no carrinho.
- `purchase`: gerado ao finalizar o pedido em `POST /api/carrinho/finalizar`.

## Erros

Resposta de erro: `{ erro: "mensagem curta em português" }` com status HTTP adequado (`400`, `401`, `403`, `404`, `409`, `413`, `429`, `500`). O front mostra a mensagem do campo `erro` quando existir.

## Sem mock

Não existem dados de exemplo no front. Sem back-end, as telas de dados mostram o estado de erro ou vazio. Quando o dataset e a API estiverem prontos, este contrato é revisado antes de qualquer `src/api/` de recurso.
