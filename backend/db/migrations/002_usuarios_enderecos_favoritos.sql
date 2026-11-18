-- 002: usuários, endereços de entrega e favoritos.
-- Idempotente: reproduz o estado de db/init.sql.

CREATE TABLE IF NOT EXISTS loja.usuarios (
  usuario_id TEXT PRIMARY KEY,
  nome       TEXT,
  email      TEXT,
  telefone   TEXT,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_usuarios_updated ON loja.usuarios;
CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON loja.usuarios
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();

CREATE TABLE IF NOT EXISTS loja.enderecos (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  TEXT NOT NULL REFERENCES loja.usuarios(usuario_id) ON DELETE CASCADE,
  apelido     TEXT,
  cep         TEXT NOT NULL,
  logradouro  TEXT NOT NULL,
  numero      TEXT NOT NULL,
  complemento TEXT,
  bairro      TEXT NOT NULL,
  cidade      TEXT NOT NULL,
  uf          CHAR(2) NOT NULL,
  padrao      BOOLEAN DEFAULT false,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_enderecos_usuario ON loja.enderecos (usuario_id);

DROP TRIGGER IF EXISTS trg_enderecos_updated ON loja.enderecos;
CREATE TRIGGER trg_enderecos_updated BEFORE UPDATE ON loja.enderecos
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();

CREATE TABLE IF NOT EXISTS loja.favoritos (
  usuario_id TEXT NOT NULL REFERENCES loja.usuarios(usuario_id) ON DELETE CASCADE,
  sku        TEXT NOT NULL REFERENCES loja.produtos(sku) ON DELETE CASCADE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, sku)
);

CREATE INDEX IF NOT EXISTS ix_favoritos_usuario ON loja.favoritos (usuario_id);
