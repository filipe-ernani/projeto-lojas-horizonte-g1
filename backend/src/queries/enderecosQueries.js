import { pool, query } from "../db.js";
import { temCaractereDeControle } from "../utils/validacao.js";
import { ensureUsuarioExiste } from "./usuariosQueries.js";

const UFS_VALIDAS = new Set([
  "AC", "AL", "AM", "AP", "BA", "CE", "DF", "ES", "GO", "MA", "MG", "MS", "MT", "PA",
  "PB", "PE", "PI", "PR", "RJ", "RN", "RO", "RR", "RS", "SC", "SE", "SP", "TO",
]);

const CAMPOS_TEXTO = [
  { campo: "apelido", maximo: 30 },
  { campo: "logradouro", maximo: 100, obrigatorio: true },
  { campo: "numero", maximo: 10, obrigatorio: true },
  { campo: "complemento", maximo: 60 },
  { campo: "bairro", maximo: 60, obrigatorio: true },
  { campo: "cidade", maximo: 60, obrigatorio: true },
];

const ERRO_OBRIGATORIOS =
  "Os campos cep, logradouro, numero, bairro, cidade e uf são obrigatórios.";

export function formatarEndereco(r) {
  if (!r) return null;
  return {
    id: Number(r.id),
    apelido: r.apelido || "",
    cep: r.cep,
    logradouro: r.logradouro,
    numero: r.numero,
    complemento: r.complemento || "",
    bairro: r.bairro,
    cidade: r.cidade,
    uf: r.uf,
    padrao: Boolean(r.padrao),
  };
}

// Devolve o texto sem espaços nas pontas, ou null se o tipo for inválido
function lerTexto(valor) {
  if (valor === undefined || valor === null) return "";
  if (typeof valor === "number" && Number.isFinite(valor)) return String(valor);
  return typeof valor === "string" ? valor.trim() : null;
}

export function validarDadosEndereco(dados = {}) {
  if (!dados || typeof dados !== "object" || Array.isArray(dados)) {
    return { valido: false, erro: ERRO_OBRIGATORIOS };
  }

  const textos = {};
  for (const { campo, maximo, obrigatorio } of CAMPOS_TEXTO) {
    const texto = lerTexto(dados[campo]);
    if (texto === null || temCaractereDeControle(texto)) {
      return { valido: false, erro: `O campo ${campo} é inválido.` };
    }
    if (obrigatorio && !texto) {
      return { valido: false, erro: ERRO_OBRIGATORIOS };
    }
    if (texto.length > maximo) {
      return {
        valido: false,
        erro: `O campo ${campo} deve ter no máximo ${maximo} caracteres.`,
      };
    }
    textos[campo] = texto;
  }

  const numeroNormalizado = textos.numero.toUpperCase();
  if (!/^(\d+[A-Z]?|S\/N)$/.test(numeroNormalizado)) {
    return {
      valido: false,
      erro: "Número inválido. Utilize apenas dígitos com letra opcional no fim (ex.: 123, 123A) ou S/N.",
    };
  }
  textos.numero = numeroNormalizado;

  const cep = lerTexto(dados.cep);
  const uf = lerTexto(dados.uf);
  if (!cep || !uf) {
    return { valido: false, erro: ERRO_OBRIGATORIOS };
  }

  if (!/^\d{5}-?\d{3}$/.test(cep)) {
    return {
      valido: false,
      erro: "CEP inválido. Utilize o formato 00000-000 ou 8 dígitos.",
    };
  }
  const cepDigitos = cep.replace("-", "");
  const cepFormatado = `${cepDigitos.slice(0, 5)}-${cepDigitos.slice(5)}`;

  const ufNormalizada = uf.toUpperCase();
  if (!UFS_VALIDAS.has(ufNormalizada)) {
    return {
      valido: false,
      erro: "UF inválida. Informe a sigla de 2 letras do estado.",
    };
  }

  const padrao = dados.padrao ?? false;
  if (typeof padrao !== "boolean") {
    return { valido: false, erro: "O campo padrao deve ser verdadeiro ou falso." };
  }

  return {
    valido: true,
    dados: {
      ...textos,
      cep: cepFormatado,
      uf: ufNormalizada,
      padrao,
    },
  };
}

// Serializa as alterações de endereços do mesmo usuário
async function travarEnderecosDoUsuario(client, usuarioId) {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0));", [
    `enderecos:${usuarioId}`,
  ]);
}

// Conflito no índice de endereço padrão vira 409 em vez de erro interno
function traduzirConflitoPadrao(erro) {
  if (erro.code === "23505" && erro.constraint === "ux_enderecos_padrao_por_usuario") {
    const conflito = new Error(
      "Outro endereço padrão foi salvo ao mesmo tempo. Tente novamente.",
    );
    conflito.status = 409;
    return conflito;
  }
  return erro;
}

export async function listarEnderecosQuery(usuarioId) {
  const res = await query(
    `SELECT * FROM loja.enderecos
     WHERE usuario_id = $1
     ORDER BY padrao DESC, id ASC;`,
    [usuarioId],
  );
  return res.rows.map(formatarEndereco);
}

export async function criarEnderecoQuery(usuarioId, emailToken, dados) {
  await ensureUsuarioExiste(usuarioId, emailToken);

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await travarEnderecosDoUsuario(client, usuarioId);

    const countRes = await client.query(
      "SELECT count(*)::int as total FROM loja.enderecos WHERE usuario_id = $1;",
      [usuarioId],
    );
    const total = countRes.rows[0].total;

    let ehPadrao = dados.padrao;
    if (total === 0) {
      ehPadrao = true; // Primeiro endereço sempre vira padrão
    } else if (ehPadrao) {
      await client.query(
        "UPDATE loja.enderecos SET padrao = false, updated_at = now() WHERE usuario_id = $1 AND padrao IS TRUE;",
        [usuarioId],
      );
    }

    const insertRes = await client.query(
      `INSERT INTO loja.enderecos (
        usuario_id, apelido, cep, logradouro, numero, complemento,
        bairro, cidade, uf, padrao, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, now())
      RETURNING *;`,
      [
        usuarioId,
        dados.apelido,
        dados.cep,
        dados.logradouro,
        dados.numero,
        dados.complemento,
        dados.bairro,
        dados.cidade,
        dados.uf,
        ehPadrao,
      ],
    );

    await client.query("COMMIT;");
    return formatarEndereco(insertRes.rows[0]);
  } catch (error_) {
    await client.query("ROLLBACK;");
    throw traduzirConflitoPadrao(error_);
  } finally {
    client.release();
  }
}

export async function atualizarEnderecoQuery(id, usuarioId, dados) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await travarEnderecosDoUsuario(client, usuarioId);

    const existRes = await client.query(
      "SELECT * FROM loja.enderecos WHERE id = $1 AND usuario_id = $2 FOR UPDATE;",
      [id, usuarioId],
    );
    if (existRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return null;
    }

    const countRes = await client.query(
      "SELECT count(*)::int as total FROM loja.enderecos WHERE usuario_id = $1;",
      [usuarioId],
    );
    const total = countRes.rows[0].total;

    let novoPadrao = dados.padrao;
    if (total === 1) {
      novoPadrao = true;
    } else if (novoPadrao) {
      await client.query(
        "UPDATE loja.enderecos SET padrao = false, updated_at = now() WHERE usuario_id = $1 AND id <> $2 AND padrao IS TRUE;",
        [usuarioId, id],
      );
    } else if (existRes.rows[0].padrao) {
      // Desmarca primeiro: o índice único aceita só um padrão por usuário
      await client.query(
        "UPDATE loja.enderecos SET padrao = false, updated_at = now() WHERE id = $1 AND usuario_id = $2;",
        [id, usuarioId],
      );
      await client.query(
        `UPDATE loja.enderecos SET padrao = true, updated_at = now()
         WHERE id = (SELECT id FROM loja.enderecos WHERE usuario_id = $1 AND id <> $2 ORDER BY id ASC LIMIT 1);`,
        [usuarioId, id],
      );
    }

    const updateRes = await client.query(
      `UPDATE loja.enderecos SET
        apelido = $3,
        cep = $4,
        logradouro = $5,
        numero = $6,
        complemento = $7,
        bairro = $8,
        cidade = $9,
        uf = $10,
        padrao = $11,
        updated_at = now()
      WHERE id = $1 AND usuario_id = $2
      RETURNING *;`,
      [
        id,
        usuarioId,
        dados.apelido,
        dados.cep,
        dados.logradouro,
        dados.numero,
        dados.complemento,
        dados.bairro,
        dados.cidade,
        dados.uf,
        novoPadrao,
      ],
    );

    await client.query("COMMIT;");
    return formatarEndereco(updateRes.rows[0]);
  } catch (error_) {
    await client.query("ROLLBACK;");
    throw traduzirConflitoPadrao(error_);
  } finally {
    client.release();
  }
}

export async function deletarEnderecoQuery(id, usuarioId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");
    await travarEnderecosDoUsuario(client, usuarioId);

    const existRes = await client.query(
      "SELECT * FROM loja.enderecos WHERE id = $1 AND usuario_id = $2;",
      [id, usuarioId],
    );
    if (existRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return false;
    }

    const eraPadrao = existRes.rows[0].padrao;

    await client.query(
      "DELETE FROM loja.enderecos WHERE id = $1 AND usuario_id = $2;",
      [id, usuarioId],
    );

    if (eraPadrao) {
      await client.query(
        `UPDATE loja.enderecos SET padrao = true, updated_at = now()
         WHERE id = (SELECT id FROM loja.enderecos WHERE usuario_id = $1 ORDER BY id ASC LIMIT 1);`,
        [usuarioId],
      );
    }

    await client.query("COMMIT;");
    return true;
  } catch (error_) {
    await client.query("ROLLBACK;");
    throw traduzirConflitoPadrao(error_);
  } finally {
    client.release();
  }
}
