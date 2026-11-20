-- Rascunho do schema do Postgres (Caio) que alimenta o pipeline.
-- Tabelas completas do app (usuarios, enderecos, favoritos) ficam em db/init.sql.
-- Tudo em UTC.

CREATE SCHEMA IF NOT EXISTS loja;
SET TIME ZONE 'UTC';

-- Mantém updated_at sempre atualizado em UPDATE.
CREATE OR REPLACE FUNCTION loja.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS loja.produtos (
  sku          TEXT PRIMARY KEY,               -- ex.: HZ-FEM-001
  nome         TEXT NOT NULL,
  modelo       TEXT,
  categoria    TEXT NOT NULL,
  grupo        TEXT,
  preco        NUMERIC(10,2) NOT NULL,
  custo        NUMERIC(10,2),
  popularidade NUMERIC(6,2),
  descricao    TEXT,
  tamanhos     TEXT[] NOT NULL DEFAULT '{}',   -- {PP,P,M,G,GG} | {34..44} | {Único}
  cores        JSONB  NOT NULL DEFAULT '[]',   -- [{"nome":"Preto","hex":"#000000"}]
  imagem_url   TEXT,                           -- vazio: o front mostra placeholder
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pedido e carrinho na mesma tabela (carrinho = status CARRINHO_ATIVO).
CREATE TABLE IF NOT EXISTS loja.pedidos (
  id              BIGSERIAL PRIMARY KEY,
  usuario_id      TEXT NOT NULL,               -- uid do Firebase (nunca exportado)
  status          TEXT NOT NULL CHECK (status IN ('CARRINHO_ATIVO','FINALIZADO','CANCELADO')),
  ultima_etapa    TEXT CHECK (ultima_etapa IN ('CARRINHO','CHECKOUT_INICIADO')),
  endereco_id     BIGINT,                      -- FK para loja.enderecos (db/init.sql)
  forma_pagamento TEXT CHECK (forma_pagamento IN ('PIX','CARTAO','BOLETO')),
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  frete           NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em   TIMESTAMPTZ,
  cancelado_em    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- No máximo um carrinho ativo por usuário.
CREATE UNIQUE INDEX IF NOT EXISTS ux_pedidos_carrinho_ativo
  ON loja.pedidos (usuario_id) WHERE status = 'CARRINHO_ATIVO';
CREATE INDEX IF NOT EXISTS ix_pedidos_updated_at ON loja.pedidos (updated_at);
CREATE INDEX IF NOT EXISTS ix_pedidos_usuario_status ON loja.pedidos (usuario_id, status);

CREATE TABLE IF NOT EXISTS loja.pedido_itens (
  id             BIGSERIAL PRIMARY KEY,
  pedido_id      BIGINT NOT NULL REFERENCES loja.pedidos(id) ON DELETE CASCADE,
  sku            TEXT   NOT NULL REFERENCES loja.produtos(sku),
  quantidade     INT    NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10,2) NOT NULL,       -- preço no momento da compra
  tamanho        TEXT,
  cor            TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_itens_pedido ON loja.pedido_itens (pedido_id);
CREATE INDEX IF NOT EXISTS ix_itens_updated_at ON loja.pedido_itens (updated_at);

-- Eventos: só INSERT, nunca UPDATE ou DELETE.
CREATE TABLE IF NOT EXISTS loja.analytics_eventos (
  evento_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento      TEXT NOT NULL CHECK (evento IN
              ('session_start','view_product','add_to_cart','begin_checkout','purchase')),
  ocorrido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  sessao_id   TEXT NOT NULL,                   -- UUID gerado pelo front por visita
  usuario_id  TEXT,                            -- vazio para visitante
  sku         TEXT,
  quantidade  INT,
  valor       NUMERIC(10,2),
  pedido_id   BIGINT REFERENCES loja.pedidos(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_eventos_sessao ON loja.analytics_eventos (sessao_id, ocorrido_em);
CREATE INDEX IF NOT EXISTS ix_eventos_updated_at ON loja.analytics_eventos (updated_at);

DROP TRIGGER IF EXISTS trg_pedidos_updated ON loja.pedidos;
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON loja.pedidos
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();
DROP TRIGGER IF EXISTS trg_itens_updated ON loja.pedido_itens;
CREATE TRIGGER trg_itens_updated BEFORE UPDATE ON loja.pedido_itens
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();

-- Views que entregam EXATAMENTE as colunas dos CSVs do contrato.
-- A extração faz: SELECT * FROM loja.vw_export_X WHERE updated_at > :desde ORDER BY updated_at
CREATE OR REPLACE VIEW loja.vw_export_pedidos AS
SELECT 'P-' || p.id                                                         AS pedido_id,
       substr(encode(sha256(convert_to(p.usuario_id, 'UTF8')), 'hex'), 1, 16) AS usuario_hash,
       p.status, p.forma_pagamento, p.subtotal, p.frete, p.valor_total,
       p.finalizado_em, p.cancelado_em, p.updated_at,
       'APP'                                                                AS origem
FROM loja.pedidos p
WHERE p.status IN ('FINALIZADO','CANCELADO');

CREATE OR REPLACE VIEW loja.vw_export_pedido_itens AS
SELECT 'PI-' || i.id AS item_id, 'P-' || i.pedido_id AS pedido_id,
       i.sku, i.quantidade, i.preco_unitario, i.tamanho, i.cor,
       i.updated_at, 'APP' AS origem
FROM loja.pedido_itens i
JOIN loja.pedidos p ON p.id = i.pedido_id
WHERE p.status IN ('FINALIZADO','CANCELADO');

CREATE OR REPLACE VIEW loja.vw_export_analytics_eventos AS
SELECT e.evento_id::text AS evento_id, e.evento, e.ocorrido_em, e.sessao_id,
       CASE WHEN e.usuario_id IS NULL THEN NULL
            ELSE substr(encode(sha256(convert_to(e.usuario_id, 'UTF8')), 'hex'), 1, 16) END AS usuario_hash,
       e.sku, e.quantidade, e.valor,
       CASE WHEN e.pedido_id IS NULL THEN NULL ELSE 'P-' || e.pedido_id END AS pedido_id,
       e.updated_at, 'APP' AS origem
FROM loja.analytics_eventos e;
