import { query } from "../db.js";
import { formatarDataLocalSaoPaulo, formatarIsoUtc } from "../utils/datas.js";
import { temCaractereDeControle } from "../utils/validacao.js";
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

/**
 * Valida o corpo do perfil. Campo ausente mantém o valor salvo; telefone vazio
 * ou null apaga o número.
 */
export function validarDadosPerfil({ nome, telefone } = {}) {
  const dados = {};

  if (nome !== undefined) {
    if (typeof nome !== "string" || temCaractereDeControle(nome)) {
      return { valido: false, erro: "O campo nome é inválido." };
    }
    dados.nome = nome.trim();
    if (dados.nome.length > 100) {
      return { valido: false, erro: "O campo nome deve ter no máximo 100 caracteres." };
    }
  }

  if (telefone !== undefined) {
    if (telefone !== null && typeof telefone !== "string") {
      return { valido: false, erro: "O campo telefone é inválido." };
    }
    dados.telefone = (telefone ?? "").trim();

    const digitos = dados.telefone.replace(/\D/g, "");
    const formatoValido =
      /^[\d\s()+-]+$/.test(dados.telefone) &&
      digitos.length >= 10 &&
      digitos.length <= 13;
    if (dados.telefone && !formatoValido) {
      return {
        valido: false,
        erro: "Telefone inválido. Informe DDD e número, como (11) 99999-9999.",
      };
    }
  }

  return { valido: true, dados };
}

export async function upsertPerfilQuery(usuarioId, emailToken, { nome, telefone } = {}) {
  const nomeParam = typeof nome === "string" ? nome.trim() : null;
  const telefoneParam = typeof telefone === "string" ? telefone.trim() : null;

  const res = await query(
    `INSERT INTO loja.usuarios (usuario_id, email, nome, telefone, criado_em, updated_at)
     VALUES ($1, $2, COALESCE($3, ''), COALESCE($4, ''), now(), now())
     ON CONFLICT (usuario_id) DO UPDATE SET
       nome = CASE WHEN $3 IS NOT NULL AND $3 <> '' THEN $3 ELSE loja.usuarios.nome END,
       telefone = CASE WHEN $5::boolean THEN COALESCE($4, '') ELSE loja.usuarios.telefone END,
       email = CASE WHEN $2 <> '' THEN $2 ELSE loja.usuarios.email END,
       updated_at = now()
     RETURNING usuario_id, nome, email, telefone, criado_em, updated_at;`,
    [usuarioId, emailToken || "", nomeParam, telefoneParam, telefone !== undefined],
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
