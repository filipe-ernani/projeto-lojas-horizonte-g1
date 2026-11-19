-- 006: Novos campos do catálogo v2 em loja.produtos
-- Idempotente com ADD COLUMN IF NOT EXISTS

ALTER TABLE loja.produtos ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE loja.produtos ADD COLUMN IF NOT EXISTS variacao TEXT;
ALTER TABLE loja.produtos ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE loja.produtos ADD COLUMN IF NOT EXISTS ocasioes TEXT[] NOT NULL DEFAULT '{}';
