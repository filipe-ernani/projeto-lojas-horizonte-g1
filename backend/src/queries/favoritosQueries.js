import { query } from "../db.js";
import { primeiraCorHex } from "./carrinhoHelpers.js";
import { formatarProduto } from "./produtosQueries.js";
import { ensureUsuarioExiste } from "./usuariosQueries.js";

export async function listarFavoritosQuery(usuarioId) {
  const res = await query(
    `SELECT p.*
     FROM loja.favoritos f
     INNER JOIN loja.produtos p ON p.sku = f.sku
     WHERE f.usuario_id = $1
     ORDER BY f.criado_em DESC, p.sku ASC;`,
    [usuarioId],
  );
  // Favorito não tem cor escolhida: usa a primeira cor do produto
  return res.rows.map((p) => ({
    ...formatarProduto(p),
    corHex: primeiraCorHex(p.cores),
  }));
}

export async function adicionarFavoritoQuery(usuarioId, emailToken, sku) {
  const produtoRes = await query(
    "SELECT 1 FROM loja.produtos WHERE sku = $1 LIMIT 1;",
    [sku],
  );
  if (produtoRes.rows.length === 0) {
    return { ok: false, motivo: "PRODUTO_NAO_ENCONTRADO" };
  }

  await ensureUsuarioExiste(usuarioId, emailToken);

  await query(
    `INSERT INTO loja.favoritos (usuario_id, sku, criado_em)
     VALUES ($1, $2, now())
     ON CONFLICT (usuario_id, sku) DO NOTHING;`,
    [usuarioId, sku],
  );

  return { ok: true };
}

export async function removerFavoritoQuery(usuarioId, sku) {
  await query(
    "DELETE FROM loja.favoritos WHERE usuario_id = $1 AND sku = $2;",
    [usuarioId, sku],
  );
  return { ok: true };
}
