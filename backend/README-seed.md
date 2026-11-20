# Gerador de Dados Simulados de BI (Lojas Horizonte)

Este script gera dados sintéticos e reproduzíveis para compor o dashboard de Business Intelligence (BI) da Lojas Horizonte (métricas de abandono de carrinho, conversão, ticket médio e cancelamento), tendo como base os produtos reais de `data/catalogo.csv`.

> **AVISO IMPORTANTE:** Todo dado gerado por este script é **SIMULADO** e marcado explicitamente com a coluna `origem: SIMULADO`. O Olist não possui dados nativos de carrinho, portanto estes registros são gerados via simulação estatística para fins analíticos e acadêmicos.

---

## Como Rodar

A partir da pasta `backend/`:

```bash
npm run seed:simulado
```

Ou a partir da raiz do projeto:

```bash
npm --prefix backend run seed:simulado
```

### Parâmetros Customizáveis

Você pode alterar os parâmetros por variáveis de ambiente ou por argumentos na linha de comando:

```bash
# Exemplo customizado via argumentos de linha de comando:
node backend/scripts/seed-simulado.js --carrinhos=10000 --dias=60 --taxa_conversao=0.04 --taxa_cancelamento=0.03 --semente=123

# Ou via variáveis de ambiente:
DIAS=90 CARRINHOS=5000 TAXA_CONVERSAO=0.03 TAXA_CANCELAMENTO=0.05 SEMENTE=42 npm --prefix backend run seed:simulado
```

| Parâmetro | Padrão | Descrição |
|---|---|---|
| `DIAS` | `90` | Janela temporal retrospectiva em dias a partir da data de execução |
| `CARRINHOS` | `5000` | Total de carrinhos de compras a simular |
| `TAXA_CONVERSAO` | `0.03` | Proporção de carrinhos que avançaram até o pedido (3%) |
| `TAXA_CANCELAMENTO` | `0.05` | Proporção de pedidos convertidos que foram cancelados (5%) |
| `SEMENTE` | `42` | Semente para o PRNG (Mulberry32), garantindo reproducibilidade |

---

## Arquivos Gerados (em `data/saida/`)

1. **`pedidos.csv`**:
   - `id`: Identificador do pedido (`PED-00001`, etc.)
   - `usuario_hash`: Hash SHA-256 truncado (16 caracteres) de identificador sintético (sem PII)
   - `status`: `FINALIZADO`, `CANCELADO` ou `CARRINHO_ATIVO`
   - `ultima_etapa`: `CARRINHO` ou `CHECKOUT_INICIADO` (vazio para `FINALIZADO` ou `CANCELADO`)
   - `valor_total`: Soma de `quantidade x preco_unitario` dos itens
   - `forma_pagamento`: `PIX`, `CARTAO_CREDITO`, `CARTAO_DEBITO` (vazio para carrinhos não finalizados)
   - `criado_em`: Data e hora ISO 8601 (com maior densidade nos finais de semana)
   - `atualizado_em`: Data e hora ISO 8601 (em `CANCELADO`, posterior a `criado_em`)
   - `origem`: Sempre `SIMULADO`

2. **`itens_pedido.csv`**:
   - `pedido_id`: ID do pedido correspondente
   - `produto_id`: `sku` do produto do catálogo
   - `quantidade`: Quantidade do item (1 a 3)
   - `preco_unitario`: Preço unitário do produto no catálogo
   - `tamanho`: Tamanho válido conforme a categoria do produto
   - `cor`: Cor detectada do produto (vazio para Beleza)
   - `origem`: Sempre `SIMULADO`

3. **`carrinhos.csv`**:
   - Contém todos os registros de `status = CARRINHO_ATIVO`
   - Colunas: `id`, `usuario_hash`, `status`, `ultima_etapa`, `valor_total`, `abandonado`, `criado_em`, `atualizado_em`, `origem`
   - `abandonado`: `true` se `atualizado_em` tem mais de 30 minutos em relação ao instante de geração; `false` caso contrário.

4. **`produtos_enriquecido.csv`**:
   - `sku`, `nome`, `categoria`, `preco`, `custo`, `descricao`, `tamanhos`, `cores`, `origem`
   - **Nota de Escopo:** Estoque não é gerado nem incluído (fora do escopo).
