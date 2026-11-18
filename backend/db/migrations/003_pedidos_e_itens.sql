-- 003: pedidos, carrinhos e itens.
-- Idempotente. O CHECK de forma_pagamento aqui é o original; a migração 005
-- o substitui e acrescenta a coluna parcelas.

CREATE TABLE IF NOT EXISTS loja.pedidos (
  id              BIGSERIAL PRIMARY KEY,
  usuario_id      TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('CARRINHO_ATIVO','FINALIZADO','CANCELADO')),
  ultima_etapa    TEXT CHECK (ultima_etapa IN ('CARRINHO','CHECKOUT_INICIADO')),
  endereco_id     BIGINT REFERENCES loja.enderecos(id) ON DELETE SET NULL,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('PIX','CARTAO','BOLETO')),
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  frete           NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em   TIMESTAMPTZ,
  cancelado_em    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_pedidos_carrinho_ativo
  ON loja.pedidos (usuario_id) WHERE status = 'CARRINHO_ATIVO';
CREATE INDEX IF NOT EXISTS ix_pedidos_updated_at ON loja.pedidos (updated_at);
CREATE INDEX IF NOT EXISTS ix_pedidos_usuario_status ON loja.pedidos (usuario_id, status);

DROP TRIGGER IF EXISTS trg_pedidos_updated ON loja.pedidos;
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON loja.pedidos
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();

CREATE TABLE IF NOT EXISTS loja.pedido_itens (
  id             BIGSERIAL PRIMARY KEY,
  pedido_id      BIGINT NOT NULL REFERENCES loja.pedidos(id) ON DELETE CASCADE,
  sku            TEXT   NOT NULL REFERENCES loja.produtos(sku),
  quantidade     INT    NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10,2) NOT NULL,
  tamanho        TEXT,
  cor            TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_itens_pedido ON loja.pedido_itens (pedido_id);
CREATE INDEX IF NOT EXISTS ix_itens_updated_at ON loja.pedido_itens (updated_at);

DROP TRIGGER IF EXISTS trg_itens_updated ON loja.pedido_itens;
CREATE TRIGGER trg_itens_updated BEFORE UPDATE ON loja.pedido_itens
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();
