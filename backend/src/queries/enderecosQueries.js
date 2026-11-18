import { pool, query } from "../db.js";
import { ensureUsuarioExiste } from "./usuariosQueries.js";

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

export function validarDadosEndereco(dados = {}) {
  const { cep, logradouro, numero, bairro, cidade, uf } = dados;

  if (!cep || !logradouro || !numero || !bairro || !cidade || !uf) {
    return {
      valido: false,
      erro: "Os campos cep, logradouro, numero, bairro, cidade e uf são obrigatórios.",
    };
  }

  const cepDigitos = String(cep).replace(/\D/g, "");
  if (cepDigitos.length !== 8) {
    return {
      valido: false,
      erro: "CEP inválido. Utilize o formato 00000-000 ou 8 dígitos.",
    };
  }
  const cepFormatado = `${cepDigitos.slice(0, 5)}-${cepDigitos.slice(5)}`;

  const ufNormalizada = String(uf).trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(ufNormalizada)) {
    return {
      valido: false,
      erro: "UF inválida. Informe a sigla de 2 letras do estado.",
    };
  }

  return {
    valido: true,
    dados: {
      apelido: dados.apelido ? String(dados.apelido).trim() : "",
      cep: cepFormatado,
      logradouro: String(logradouro).trim(),
      numero: String(numero).trim(),
      complemento: dados.complemento ? String(dados.complemento).trim() : "",
      bairro: String(bairro).trim(),
      cidade: String(cidade).trim(),
      uf: ufNormalizada,
      padrao: Boolean(dados.padrao),
    },
  };
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
        "UPDATE loja.enderecos SET padrao = false, updated_at = now() WHERE usuario_id = $1;",
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
    throw error_;
  } finally {
    client.release();
  }
}

export async function atualizarEnderecoQuery(id, usuarioId, dados) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

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
        "UPDATE loja.enderecos SET padrao = false, updated_at = now() WHERE usuario_id = $1 AND id <> $2;",
        [usuarioId, id],
      );
    } else if (existRes.rows[0].padrao && !novoPadrao) {
      // Se era o padrão e desmarcou, promove outro endereço
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
    throw error_;
  } finally {
    client.release();
  }
}

export async function deletarEnderecoQuery(id, usuarioId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

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
    throw error_;
  } finally {
    client.release();
  }
}
