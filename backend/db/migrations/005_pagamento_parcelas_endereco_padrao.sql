-- 005: formas de pagamento detalhadas, parcelas e um endereço padrão por usuário.
-- Idempotente. A única alteração de dados é converter CARTAO em CARTAO_CREDITO.

-- Remove o CHECK que valida apenas forma_pagamento, seja qual for o nome dele.
DO $$
DECLARE
  restricao record;
BEGIN
  FOR restricao IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attname = 'forma_pagamento'
    WHERE c.conrelid = 'loja.pedidos'::regclass
      AND c.contype = 'c'
      AND c.conkey = ARRAY[a.attnum]
  LOOP
    EXECUTE format('ALTER TABLE loja.pedidos DROP CONSTRAINT %I', restricao.conname);
  END LOOP;
END;
$$;

UPDATE loja.pedidos SET forma_pagamento = 'CARTAO_CREDITO' WHERE forma_pagamento = 'CARTAO';

ALTER TABLE loja.pedidos
  ADD CONSTRAINT pedidos_forma_pagamento_check
  CHECK (forma_pagamento IN ('PIX','CARTAO_CREDITO','CARTAO_DEBITO','BOLETO'));

ALTER TABLE loja.pedidos ADD COLUMN IF NOT EXISTS parcelas SMALLINT NOT NULL DEFAULT 1;

ALTER TABLE loja.pedidos DROP CONSTRAINT IF EXISTS pedidos_parcelas_faixa_check;
ALTER TABLE loja.pedidos
  ADD CONSTRAINT pedidos_parcelas_faixa_check CHECK (parcelas BETWEEN 1 AND 12);

-- IS NOT DISTINCT FROM: com forma_pagamento nula, parcelas também precisa ser 1.
ALTER TABLE loja.pedidos DROP CONSTRAINT IF EXISTS pedidos_parcelas_credito_check;
ALTER TABLE loja.pedidos
  ADD CONSTRAINT pedidos_parcelas_credito_check
  CHECK (forma_pagamento IS NOT DISTINCT FROM 'CARTAO_CREDITO' OR parcelas = 1);

-- Coluna nova sempre no fim, para preservar a ordem do contrato de exportação.
CREATE OR REPLACE VIEW loja.vw_export_pedidos AS
SELECT 'P-' || p.id                                                           AS pedido_id,
       substr(encode(sha256(convert_to(p.usuario_id, 'UTF8')), 'hex'), 1, 16) AS usuario_hash,
       p.status, p.forma_pagamento, p.subtotal, p.frete, p.valor_total,
       p.finalizado_em, p.cancelado_em, p.updated_at,
       'APP'                                                                  AS origem,
       p.parcelas
FROM loja.pedidos p
WHERE p.status IN ('FINALIZADO','CANCELADO');

-- No máximo um endereço padrão por usuário.
CREATE UNIQUE INDEX IF NOT EXISTS ux_enderecos_padrao_por_usuario
  ON loja.enderecos (usuario_id) WHERE padrao IS TRUE;
