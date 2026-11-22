-- 008: novo formato do export de avaliações, pedido pela Engenharia de Dados.
-- Só recria a VIEW loja.vw_export_avaliacoes. Nenhuma tabela ou dado é alterado.
-- Idempotente: pode rodar mais de uma vez.
--
-- Colunas, nesta ordem:
--   avaliacao_id, pedido_id, sku, usuario_hash, nota, titulo, comentario,
--   avaliado_em, updated_at, origem
-- - titulo: não existe no site, sai sempre vazio (NULL).
-- - avaliado_em: data da criação da avaliação (criado_em).
-- - updated_at: muda a cada edição, então a avaliação editada volta no próximo lote.
-- - origem: valor fixo 'APP' na exportação. No banco continua SITE/HISTORICO.
-- Só saem avaliações feitas no site (origem SITE); o histórico importado nunca sai.

DROP VIEW IF EXISTS loja.vw_export_avaliacoes;

CREATE VIEW loja.vw_export_avaliacoes AS
SELECT a.avaliacao_id,
       a.pedido_id,
       a.sku,
       a.usuario_hash,
       a.nota,
       NULL::text      AS titulo,
       a.comentario,
       a.criado_em     AS avaliado_em,
       a.updated_at,
       'APP'::text     AS origem
FROM loja.avaliacoes a
WHERE a.origem = 'SITE';
