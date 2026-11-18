import { query } from "../db.js";
import { formatarDataLocalSaoPaulo, formatarIsoUtc } from "../utils/datas.js";
import { usuariosGarantidos } from "../middlewares/auth.js";

export async function buscarPerfilQuery(usuarioId, emailToken = "") {
  const res = await query(
    "SELECT usuario_id, nome, email, telefone, criado_em, updated_at FROM loja.usuarios WHERE usuario_id = $1 LIMIT 1;",
    [usuarioId],
  );

  if (res.rows.length === 0) {
    return {
      nome: "",
      email: emailToken,
      telefone: "",
      criadoEm: null,
      dataLocal: null,
      updatedAt: null,
      updatedAtLocal: null,
    };
  }

  const user = res.rows[0];
  return {
    nome: user.nome || "",
    email: user.email || emailToken,
    telefone: user.telefone || "",
    criadoEm: formatarIsoUtc(user.criado_em),
    dataLocal: formatarDataLocalSaoPaulo(user.criado_em),
    updatedAt: formatarIsoUtc(user.updated_at),
    updatedAtLocal: formatarDataLocalSaoPaulo(user.updated_at),
  };
}

export async function upsertPerfilQuery(usuarioId, emailToken, { nome, telefone } = {}) {
  const nomeParam = typeof nome === "string" ? nome.trim() : null;
  const telefoneParam = typeof telefone === "string" ? telefone.trim() : null;

  const res = await query(
    `INSERT INTO loja.usuarios (usuario_id, email, nome, telefone, criado_em, updated_at)
     VALUES ($1, $2, COALESCE($3, ''), COALESCE($4, ''), now(), now())
     ON CONFLICT (usuario_id) DO UPDATE SET
       nome = CASE WHEN $3 IS NOT NULL AND $3 <> '' THEN $3 ELSE loja.usuarios.nome END,
       telefone = CASE WHEN $4 IS NOT NULL AND $4 <> '' THEN $4 ELSE loja.usuarios.telefone END,
       email = CASE WHEN $2 <> '' THEN $2 ELSE loja.usuarios.email END,
       updated_at = now()
     RETURNING usuario_id, nome, email, telefone, criado_em, updated_at;`,
    [usuarioId, emailToken || "", nomeParam, telefoneParam],
  );

  if (usuariosGarantidos) {
    usuariosGarantidos.add(usuarioId);
  }

  const row = res.rows[0];
  return {
    nome: row.nome || "",
    email: row.email || emailToken,
    telefone: row.telefone || "",
    criadoEm: formatarIsoUtc(row.criado_em),
    dataLocal: formatarDataLocalSaoPaulo(row.criado_em),
    updatedAt: formatarIsoUtc(row.updated_at),
    updatedAtLocal: formatarDataLocalSaoPaulo(row.updated_at),
  };
}

export async function ensureUsuarioExiste(usuarioId, emailToken = "", nomeToken = "") {
  await query(
    `INSERT INTO loja.usuarios (usuario_id, email, nome, criado_em, updated_at)
     VALUES ($1, $2, $3, now(), now())
     ON CONFLICT (usuario_id) DO NOTHING;`,
    [usuarioId, emailToken, nomeToken],
  );
  if (usuariosGarantidos) {
    usuariosGarantidos.add(usuarioId);
  }
}
