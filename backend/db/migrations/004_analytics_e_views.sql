-- 004: eventos de analytics e views de exportação.
-- Idempotente. vw_export_pedidos só é criada se ainda não existir: em um banco
-- iniciado pelo init.sql atual ela já tem a coluna parcelas, e CREATE OR REPLACE
-- com menos colunas falharia. A forma final da view é definida na migração 005.

CREATE TABLE IF NOT EXISTS loja.analytics_eventos (
  evento_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento      TEXT NOT NULL CHECK (evento IN
              ('session_start','view_product','add_to_cart','begin_checkout','purchase')),
  ocorrido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  sessao_id   TEXT NOT NULL,
  usuario_id  TEXT,
  sku         TEXT,
  quantidade  INT,
  valor       NUMERIC(10,2),
  pedido_id   BIGINT REFERENCES loja.pedidos(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_eventos_sessao ON loja.analytics_eventos (sessao_id, ocorrido_em);
CREATE INDEX IF NOT EXISTS ix_eventos_updated_at ON loja.analytics_eventos (updated_at);

DO $$
BEGIN
  IF to_regclass('loja.vw_export_pedidos') IS NULL THEN
    CREATE VIEW loja.vw_export_pedidos AS
    SELECT 'P-' || p.id                                                           AS pedido_id,
           substr(encode(sha256(convert_to(p.usuario_id, 'UTF8')), 'hex'), 1, 16) AS usuario_hash,
           p.status, p.forma_pagamento, p.subtotal, p.frete, p.valor_total,
           p.finalizado_em, p.cancelado_em, p.updated_at,
           'APP'                                                                  AS origem
    FROM loja.pedidos p
    WHERE p.status IN ('FINALIZADO','CANCELADO');
  END IF;
END;
$$;

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
