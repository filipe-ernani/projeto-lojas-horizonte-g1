-- Schema do banco de dados do Horizonte (PostgreSQL 16)
-- Fonte de verdade da camada relacional e pipeline de analytics.
-- Todos os horários registrados em UTC.

CREATE SCHEMA IF NOT EXISTS loja;
SET TIME ZONE 'UTC';

-- Mantém updated_at sempre atualizado automaticamente em UPDATE
CREATE OR REPLACE FUNCTION loja.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Catálogo de Produtos
CREATE TABLE IF NOT EXISTS loja.produtos (
  ordem        INT GENERATED ALWAYS AS IDENTITY,
  sku          TEXT PRIMARY KEY,               -- ex.: HZ-FEM-001 (D-22: id público do produto)
  nome         TEXT NOT NULL,
  modelo       TEXT,
  categoria    TEXT NOT NULL,
  grupo        TEXT,
  preco        NUMERIC(10,2) NOT NULL,
  custo        NUMERIC(10,2),
  popularidade NUMERIC(6,2),
  tipo         TEXT,
  variacao     TEXT,
  descricao    TEXT,
  ocasioes     TEXT[] NOT NULL DEFAULT '{}',
  tamanhos     TEXT[] NOT NULL DEFAULT '{}',   -- {PP,P,M,G,GG} | {34..44} | {Único} (D-21)
  cores        JSONB  NOT NULL DEFAULT '[]',   -- [{"nome":"Marrom","hex":"#6B4E3D"}] (D-21)
  imagem_url   TEXT,                           -- nulo: o front mostra placeholder nativo
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_produtos_categoria ON loja.produtos (categoria);
CREATE INDEX IF NOT EXISTS ix_produtos_ordem ON loja.produtos (ordem);
CREATE INDEX IF NOT EXISTS ix_produtos_popularidade ON loja.produtos (popularidade DESC);

DROP TRIGGER IF EXISTS trg_produtos_updated ON loja.produtos;
CREATE TRIGGER trg_produtos_updated BEFORE UPDATE ON loja.produtos
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();

-- Usuários registrados no sistema (autenticação Firebase)
CREATE TABLE IF NOT EXISTS loja.usuarios (
  usuario_id TEXT PRIMARY KEY,                 -- uid do Firebase Auth
  nome       TEXT,
  email      TEXT,
  telefone   TEXT,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_usuarios_updated ON loja.usuarios;
CREATE TRIGGER trg_usuarios_updated BEFORE UPDATE ON loja.usuarios
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();

-- Endereços de entrega vinculados aos usuários
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
-- No máximo um endereço padrão por usuário
CREATE UNIQUE INDEX IF NOT EXISTS ux_enderecos_padrao_por_usuario
  ON loja.enderecos (usuario_id) WHERE padrao IS TRUE;

DROP TRIGGER IF EXISTS trg_enderecos_updated ON loja.enderecos;
CREATE TRIGGER trg_enderecos_updated BEFORE UPDATE ON loja.enderecos
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();

-- Produtos favoritos salvos por usuário
CREATE TABLE IF NOT EXISTS loja.favoritos (
  usuario_id TEXT NOT NULL REFERENCES loja.usuarios(usuario_id) ON DELETE CASCADE,
  sku        TEXT NOT NULL REFERENCES loja.produtos(sku) ON DELETE CASCADE,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, sku)
);

CREATE INDEX IF NOT EXISTS ix_favoritos_usuario ON loja.favoritos (usuario_id);

-- Pedidos e Carrinhos (carrinho = status CARRINHO_ATIVO)
CREATE TABLE IF NOT EXISTS loja.pedidos (
  id              BIGSERIAL PRIMARY KEY,
  usuario_id      TEXT NOT NULL,               -- uid do Firebase (nunca exportado)
  status          TEXT NOT NULL CHECK (status IN ('CARRINHO_ATIVO','FINALIZADO','CANCELADO')),
  ultima_etapa    TEXT CHECK (ultima_etapa IN ('CARRINHO','CHECKOUT_INICIADO')),
  endereco_id     BIGINT REFERENCES loja.enderecos(id) ON DELETE SET NULL,
  forma_pagamento TEXT CONSTRAINT pedidos_forma_pagamento_check
                  CHECK (forma_pagamento IN ('PIX','CARTAO_CREDITO','CARTAO_DEBITO','BOLETO')),
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  frete           NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finalizado_em   TIMESTAMPTZ,
  cancelado_em    TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  parcelas        SMALLINT NOT NULL DEFAULT 1,
  CONSTRAINT pedidos_parcelas_faixa_check CHECK (parcelas BETWEEN 1 AND 12),
  -- IS NOT DISTINCT FROM: com forma_pagamento nula, parcelas também precisa ser 1
  CONSTRAINT pedidos_parcelas_credito_check
    CHECK (forma_pagamento IS NOT DISTINCT FROM 'CARTAO_CREDITO' OR parcelas = 1)
);

-- No máximo um carrinho ativo por usuário
CREATE UNIQUE INDEX IF NOT EXISTS ux_pedidos_carrinho_ativo
  ON loja.pedidos (usuario_id) WHERE status = 'CARRINHO_ATIVO';
CREATE INDEX IF NOT EXISTS ix_pedidos_updated_at ON loja.pedidos (updated_at);
CREATE INDEX IF NOT EXISTS ix_pedidos_usuario_status ON loja.pedidos (usuario_id, status);

DROP TRIGGER IF EXISTS trg_pedidos_updated ON loja.pedidos;
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON loja.pedidos
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();

-- Itens de Pedido ou Carrinho
CREATE TABLE IF NOT EXISTS loja.pedido_itens (
  id             BIGSERIAL PRIMARY KEY,
  pedido_id      BIGINT NOT NULL REFERENCES loja.pedidos(id) ON DELETE CASCADE,
  sku            TEXT   NOT NULL REFERENCES loja.produtos(sku),
  quantidade     INT    NOT NULL CHECK (quantidade > 0),
  preco_unitario NUMERIC(10,2) NOT NULL,       -- preço congelado no momento da compra
  tamanho        TEXT,
  cor            TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_itens_pedido ON loja.pedido_itens (pedido_id);
CREATE INDEX IF NOT EXISTS ix_itens_updated_at ON loja.pedido_itens (updated_at);

DROP TRIGGER IF EXISTS trg_itens_updated ON loja.pedido_itens;
CREATE TRIGGER trg_itens_updated BEFORE UPDATE ON loja.pedido_itens
  FOR EACH ROW EXECUTE FUNCTION loja.set_updated_at();

-- Eventos de Analytics do pipeline de BI (D-23: gravados pelo back-end)
CREATE TABLE IF NOT EXISTS loja.analytics_eventos (
  evento_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento      TEXT NOT NULL CHECK (evento IN
              ('session_start','view_product','add_to_cart','begin_checkout','purchase')),
  ocorrido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  sessao_id   TEXT NOT NULL,                   -- UUID gerado por visita
  usuario_id  TEXT,                            -- nulo para visitante anônimo
  sku         TEXT,
  quantidade  INT,
  valor       NUMERIC(10,2),
  pedido_id   BIGINT REFERENCES loja.pedidos(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_eventos_sessao ON loja.analytics_eventos (sessao_id, ocorrido_em);
CREATE INDEX IF NOT EXISTS ix_eventos_updated_at ON loja.analytics_eventos (updated_at);

-- Views analíticas exportadas para o pipeline
CREATE OR REPLACE VIEW loja.vw_export_pedidos AS
SELECT 'P-' || p.id                                                           AS pedido_id,
       substr(encode(sha256(convert_to(p.usuario_id, 'UTF8')), 'hex'), 1, 16) AS usuario_hash,
       p.status, p.forma_pagamento, p.subtotal, p.frete, p.valor_total,
       p.finalizado_em, p.cancelado_em, p.updated_at,
       'APP'                                                                  AS origem,
       p.parcelas
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

-- Avaliações de produtos (site e histórico importado)
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
