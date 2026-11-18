-- 001: schema loja, função de updated_at e catálogo de produtos.
-- Idempotente: reproduz o estado de db/init.sql.

CREATE SCHEMA IF NOT EXISTS loja;

CREATE OR REPLACE FUNCTION loja.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS loja.produtos (
  ordem        INT GENERATED ALWAYS AS IDENTITY,
  sku          TEXT PRIMARY KEY,
  nome         TEXT NOT NULL,
  modelo       TEXT,
  categoria    TEXT NOT NULL,
  grupo        TEXT,
  preco        NUMERIC(10,2) NOT NULL,
  custo        NUMERIC(10,2),
  popularidade NUMERIC(6,2),
  descricao    TEXT,
  tamanhos     TEXT[] NOT NULL DEFAULT '{}',
  cores        JSONB  NOT NULL DEFAULT '[]',
  imagem_url   TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_produtos_categoria ON loja.produtos (categoria);
CREATE INDEX IF NOT EXISTS ix_produtos_ordem ON loja.produtos (ordem);
CREATE INDEX IF NOT EXISTS ix_produtos_popularidade ON loja.produtos (popularidade DESC);

DROP TRIGGER IF EXISTS trg_produtos_updated ON loja.produtos;
CREATE TRIGGER trg_produtos_updated BEFORE UPDATE ON loja.produtos
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();
