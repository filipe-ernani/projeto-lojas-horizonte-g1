import crypto from "node:crypto";
import { query } from "../db.js";
import { corHexPorNome } from "./carrinhoHelpers.js";
import { ensureUsuarioExiste } from "./usuariosQueries.js";
import { formatarDataLocalSaoPaulo, formatarIsoUtc } from "../utils/datas.js";

const LIMITE_PADRAO_AVALIACOES = 10;
const LIMITE_MAXIMO_AVALIACOES = 48;

export function gerarUsuarioHash(usuarioId) {
  return crypto
    .createHash("sha256")
    .update(String(usuarioId), "utf8")
    .digest("hex")
    .slice(0, 16);
}

function extrairPrimeiroNome(nomeCompleto) {
  const limpo = String(nomeCompleto || "").trim();
  if (!limpo) return "Cliente Horizonte";
  return limpo.split(/\s+/)[0];
}

function formatarAvaliacaoPublica(row) {
  const autor =
    row.origem === "SITE"
      ? extrairPrimeiroNome(row.usuario_nome)
      : "Cliente Horizonte";

  return {
    id: row.avaliacao_id,
    nota: Number(row.nota),
    comentario: row.comentario ?? null,
    autor,
    criadoEm: formatarIsoUtc(row.criado_em),
    dataLocal: formatarDataLocalSaoPaulo(row.criado_em),
  };
}

function lerInteiroPositivo(valor, padrao) {
  if (valor === undefined || valor === null || valor === "") return padrao;
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero >= 1 ? numero : null;
}

export function validarPaginacaoAvaliacoes(filtros = {}) {
  const pagina = lerInteiroPositivo(filtros.pagina, 1);
  if (pagina === null) {
    return { erro: "Parâmetro 'pagina' inválido. Use um número inteiro a partir de 1." };
  }

  const limite = lerInteiroPositivo(filtros.limite, LIMITE_PADRAO_AVALIACOES);
  if (limite === null) {
    return { erro: "Parâmetro 'limite' inválido. Use um número inteiro a partir de 1." };
  }

  const limiteFinal = Math.min(LIMITE_MAXIMO_AVALIACOES, limite);
  if (!Number.isSafeInteger((pagina - 1) * limiteFinal)) {
    return { erro: "Parâmetro 'pagina' inválido. Use um número menor." };
  }

  return { dados: { pagina, limite: limiteFinal } };
}

export async function listarAvaliacoesProdutoQuery(sku, { pagina = 1, limite = 10 } = {}) {
  const prodRes = await query(
    "SELECT 1 FROM loja.produtos WHERE sku = $1 LIMIT 1;",
    [sku],
  );
  if (prodRes.rows.length === 0) {
    return null;
  }

  const resumoRes = await query(
    `SELECT
       COUNT(*)::int AS total,
       ROUND(AVG(nota), 1) AS media,
       COUNT(*) FILTER (WHERE nota = 1)::int AS n1,
       COUNT(*) FILTER (WHERE nota = 2)::int AS n2,
       COUNT(*) FILTER (WHERE nota = 3)::int AS n3,
       COUNT(*) FILTER (WHERE nota = 4)::int AS n4,
       COUNT(*) FILTER (WHERE nota = 5)::int AS n5
     FROM loja.avaliacoes
     WHERE sku = $1;`,
    [sku],
  );

  const r = resumoRes.rows[0];
  const total = Number(r?.total) || 0;
  const media =
    total > 0 && r?.media !== null && r?.media !== undefined
      ? Math.round(Number(r.media) * 10) / 10
      : null;

  const offset = (pagina - 1) * limite;
  const itensRes = await query(
    `SELECT a.avaliacao_id, a.nota, a.comentario, a.origem, a.criado_em, u.nome AS usuario_nome
     FROM loja.avaliacoes a
     LEFT JOIN loja.usuarios u ON u.usuario_id = a.usuario_id
     WHERE a.sku = $1
     ORDER BY a.criado_em DESC, a.avaliacao_id DESC
     LIMIT $2 OFFSET $3;`,
    [sku, limite, offset],
  );

  return {
    itens: itensRes.rows.map(formatarAvaliacaoPublica),
    resumo: {
      media,
      total,
      distribuicao: {
        1: Number(r?.n1) || 0,
        2: Number(r?.n2) || 0,
        3: Number(r?.n3) || 0,
        4: Number(r?.n4) || 0,
        5: Number(r?.n5) || 0,
      },
    },
  };
}

export function validarCorpoAvaliacao(corpo) {
  if (!corpo || typeof corpo !== "object" || Array.isArray(corpo)) {
    return { erro: "Corpo da requisição inválido." };
  }

  const { nota, comentario } = corpo;
  if (typeof nota !== "number" || !Number.isInteger(nota) || nota < 1 || nota > 5) {
    return { erro: "A nota deve ser um número inteiro de 1 a 5." };
  }

  let comentarioFinal = null;
  if (comentario !== undefined && comentario !== null) {
    if (typeof comentario !== "string" || comentario.includes("\0")) {
      return { erro: "O comentário deve ser um texto válido." };
    }
    const limpo = comentario.trim();
    if (limpo.length > 1000) {
      return { erro: "O comentário deve ter no máximo 1000 caracteres." };
    }
    comentarioFinal = limpo.length > 0 ? limpo : null;
  }

  return { dados: { nota, comentario: comentarioFinal } };
}

export async function salvarAvaliacaoQuery({
  usuarioId,
  emailToken,
  sku,
  nota,
  comentario,
}) {
  const prodRes = await query(
    "SELECT 1 FROM loja.produtos WHERE sku = $1 LIMIT 1;",
    [sku],
  );
  if (prodRes.rows.length === 0) {
    return { erro: "Produto não encontrado.", status: 404 };
  }

  const compraRes = await query(
    `SELECT p.id
     FROM loja.pedidos p
     JOIN loja.pedido_itens i ON i.pedido_id = p.id
     WHERE p.usuario_id = $1 AND p.status = 'FINALIZADO' AND i.sku = $2
     ORDER BY p.finalizado_em DESC NULLS LAST, p.id DESC
     LIMIT 1;`,
    [usuarioId, sku],
  );

  if (compraRes.rows.length === 0) {
    return {
      erro: "Você só pode avaliar produtos de pedidos finalizados.",
      status: 403,
    };
  }

  await ensureUsuarioExiste(usuarioId, emailToken);

  const usuarioHash = gerarUsuarioHash(usuarioId);
  const pedidoId = `P-${compraRes.rows[0].id}`;

  const upsertRes = await query(
    `INSERT INTO loja.avaliacoes (
       pedido_id, usuario_id, usuario_hash, sku, nota, comentario, origem
     ) VALUES (
       $1, $2, $3, $4, $5, $6, 'SITE'
     )
     ON CONFLICT (usuario_hash, sku) DO UPDATE SET
       nota = EXCLUDED.nota,
       comentario = EXCLUDED.comentario,
       pedido_id = COALESCE(loja.avaliacoes.pedido_id, EXCLUDED.pedido_id),
       usuario_id = COALESCE(loja.avaliacoes.usuario_id, EXCLUDED.usuario_id),
       updated_at = now()
     RETURNING (xmax = 0) AS inserida, avaliacao_id, nota, comentario, origem, criado_em, updated_at;`,
    [pedidoId, usuarioId, usuarioHash, sku, nota, comentario],
  );

  const row = upsertRes.rows[0];
  const userRes = await query(
    "SELECT nome FROM loja.usuarios WHERE usuario_id = $1 LIMIT 1;",
    [usuarioId],
  );
  row.usuario_nome = userRes.rows[0]?.nome || null;

  return {
    criada: Boolean(row.inserida),
    avaliacao: {
      ...formatarAvaliacaoPublica(row),
      updatedAt: formatarIsoUtc(row.updated_at),
    },
  };
}

export async function buscarMinhaAvaliacaoQuery(usuarioId, sku) {
  const prodRes = await query(
    "SELECT 1 FROM loja.produtos WHERE sku = $1 LIMIT 1;",
    [sku],
  );
  if (prodRes.rows.length === 0) {
    return null;
  }

  const usuarioHash = gerarUsuarioHash(usuarioId);

  const [compraRes, avRes] = await Promise.all([
    query(
      `SELECT 1
       FROM loja.pedidos p
       JOIN loja.pedido_itens i ON i.pedido_id = p.id
       WHERE p.usuario_id = $1 AND p.status = 'FINALIZADO' AND i.sku = $2
       LIMIT 1;`,
      [usuarioId, sku],
    ),
    query(
      `SELECT a.avaliacao_id, a.nota, a.comentario, a.origem, a.criado_em, u.nome AS usuario_nome
       FROM loja.avaliacoes a
       LEFT JOIN loja.usuarios u ON u.usuario_id = a.usuario_id
       WHERE a.usuario_hash = $1 AND a.sku = $2
       LIMIT 1;`,
      [usuarioHash, sku],
    ),
  ]);

  return {
    podeAvaliar: compraRes.rows.length > 0,
    avaliacao: avRes.rows[0] ? formatarAvaliacaoPublica(avRes.rows[0]) : null,
  };
}

export async function listarAvaliacoesPendentesQuery(usuarioId) {
  const usuarioHash = gerarUsuarioHash(usuarioId);

  const res = await query(
    `SELECT DISTINCT ON (i.sku)
       i.sku,
       pr.nome,
       pr.tipo,
       i.cor,
       pr.cores,
       p.id AS pedido_id,
       p.finalizado_em
     FROM loja.pedidos p
     JOIN loja.pedido_itens i ON i.pedido_id = p.id
     JOIN loja.produtos pr ON pr.sku = i.sku
     WHERE p.usuario_id = $1
       AND p.status = 'FINALIZADO'
       AND NOT EXISTS (
         SELECT 1
         FROM loja.avaliacoes a
         WHERE a.usuario_hash = $2 AND a.sku = i.sku
       )
     ORDER BY i.sku, p.finalizado_em DESC NULLS LAST, p.id DESC;`,
    [usuarioId, usuarioHash],
  );

  return res.rows.map((r) => ({
    sku: r.sku,
    nome: r.nome,
    tipo: r.tipo || null,
    cor: r.cor || null,
    corHex: corHexPorNome(r.cores, r.cor),
    pedidoId: Number(r.pedido_id),
    finalizadoEm: formatarIsoUtc(r.finalizado_em),
  }));
}
