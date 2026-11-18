import { query } from "../db.js";

export async function buscarPerfilQuery(usuarioId, emailToken = "") {
  const res = await query(
    "SELECT nome, email, telefone FROM loja.usuarios WHERE usuario_id = $1 LIMIT 1;",
    [usuarioId],
  );

  if (res.rows.length === 0) {
    return {
      nome: "",
      email: emailToken,
      telefone: "",
    };
  }

  const user = res.rows[0];
  return {
    nome: user.nome || "",
    email: user.email || emailToken,
    telefone: user.telefone || "",
  };
}

export async function upsertPerfilQuery(usuarioId, emailToken, { nome, telefone }) {
  const res = await query(
    `INSERT INTO loja.usuarios (usuario_id, nome, email, telefone, criado_em, updated_at)
     VALUES ($1, $2, $3, $4, now(), now())
     ON CONFLICT (usuario_id) DO UPDATE SET
       nome = EXCLUDED.nome,
       telefone = EXCLUDED.telefone,
       updated_at = now()
     RETURNING nome, email, telefone;`,
    [usuarioId, nome || "", emailToken || "", telefone || ""],
  );

  const row = res.rows[0];
  return {
    nome: row.nome || "",
    email: row.email || emailToken,
    telefone: row.telefone || "",
  };
}

export async function ensureUsuarioExiste(usuarioId, emailToken = "") {
  await query(
    `INSERT INTO loja.usuarios (usuario_id, email, criado_em, updated_at)
     VALUES ($1, $2, now(), now())
     ON CONFLICT (usuario_id) DO NOTHING;`,
    [usuarioId, emailToken],
  );
}
