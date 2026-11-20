-- 007: Tabela de avaliações de produtos e view de exportação.
-- Idempotente.

CREATE SEQUENCE IF NOT EXISTS loja.seq_avaliacao_id START 1;

CREATE TABLE IF NOT EXISTS loja.avaliacoes (
  avaliacao_id TEXT PRIMARY KEY DEFAULT ('AV-' || nextval('loja.seq_avaliacao_id')),
  pedido_id    TEXT NULL,
  usuario_id   TEXT NULL REFERENCES loja.usuarios(usuario_id) ON DELETE SET NULL,
  usuario_hash TEXT NOT NULL,
  sku          TEXT NOT NULL REFERENCES loja.produtos(sku) ON DELETE CASCADE,
  nota         SMALLINT NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario   TEXT NULL CHECK (comentario IS NULL OR char_length(comentario) <= 1000),
  origem       TEXT NOT NULL DEFAULT 'SITE' CHECK (origem IN ('SITE', 'HISTORICO')),
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_avaliacoes_usuario_sku UNIQUE (usuario_hash, sku),
  CONSTRAINT chk_avaliacoes_origem_site CHECK (
    origem <> 'SITE' OR (usuario_id IS NOT NULL AND pedido_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS ix_avaliacoes_sku ON loja.avaliacoes (sku);
CREATE INDEX IF NOT EXISTS ix_avaliacoes_updated_at ON loja.avaliacoes (updated_at);

CREATE OR REPLACE VIEW loja.vw_export_avaliacoes AS
SELECT a.avaliacao_id,
       a.pedido_id,
       a.usuario_hash,
       a.sku,
       a.nota,
       a.comentario,
       a.criado_em,
       a.updated_at,
       a.origem
FROM loja.avaliacoes a
WHERE a.origem = 'SITE';
