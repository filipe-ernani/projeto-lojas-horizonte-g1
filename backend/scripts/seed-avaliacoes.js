import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";
import { opcaoSslBanco } from "../src/dbConfig.js";
import { parseCsvRfc4180 } from "../src/utils/csvParser.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const { Pool } = pg;

function resolverCaminhoCsv(arg) {
  if (!arg) {
    throw new Error("Informe o caminho do arquivo CSV. Ex.: npm run seed:avaliacoes -- caminho/avaliacoes.csv");
  }
  const direto = path.resolve(process.cwd(), arg);
  if (fs.existsSync(direto)) return direto;

  const acima = path.resolve(process.cwd(), "..", arg);
  if (fs.existsSync(acima)) return acima;

  throw new Error(`Arquivo CSV não encontrado: ${arg}`);
}

function dataValida(valor) {
  if (!valor || typeof valor !== "string") return null;
  const limpo = valor.trim();
  if (!limpo) return null;
  const d = new Date(limpo);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export function validarRegistrosAvaliacoes(cabecalho, registros) {
  const erros = [];
  const obrigatorias = ["sku", "nota", "criado_em"];

  for (const col of obrigatorias) {
    if (!cabecalho.includes(col)) {
      erros.push(`Coluna obrigatória ausente no cabeçalho: "${col}".`);
    }
  }
  if (erros.length > 0) {
    throw new Error(`Erro no cabeçalho do CSV:\n- ${erros.join("\n- ")}`);
  }

  const validados = [];
  for (const reg of registros) {
    const linha = reg._linhaArquivo;
    const sku = String(reg.sku || "").trim();
    const notaRaw = String(reg.nota || "").trim();
    const nota = /^\d+$/.test(notaRaw) ? Number(notaRaw) : NaN;
    const criadoEmDate = dataValida(reg.criado_em);

    if (!sku) {
      erros.push(`Linha ${linha}: SKU vazio.`);
    }
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
      erros.push(`Linha ${linha} (SKU ${sku}): nota inválida ("${reg.nota}"). Deve ser inteiro de 1 a 5.`);
    }
    if (!criadoEmDate) {
      erros.push(`Linha ${linha} (SKU ${sku}): criado_em inválido ("${reg.criado_em}").`);
    }

    let comentario = null;
    if (reg.comentario !== undefined && reg.comentario !== null) {
      const limpo = String(reg.comentario).trim();
      if (limpo.length > 1000) {
        erros.push(`Linha ${linha} (SKU ${sku}): comentário excede 1000 caracteres.`);
      } else if (limpo.length > 0) {
        comentario = limpo;
      }
    }

    let updatedAtDate = criadoEmDate;
    if (reg.updated_at !== undefined && String(reg.updated_at).trim() !== "") {
      const parsedUpd = dataValida(reg.updated_at);
      if (!parsedUpd) {
        erros.push(`Linha ${linha} (SKU ${sku}): updated_at inválido ("${reg.updated_at}").`);
      } else {
        updatedAtDate = parsedUpd;
      }
    }

    const criadoIso = criadoEmDate ? criadoEmDate.toISOString() : "";
    const usuarioHashRaw = String(reg.usuario_hash || "").trim();
    const usuarioHash =
      usuarioHashRaw ||
      crypto
        .createHash("sha256")
        .update(`HISTORICO:${sku}:${criadoIso}:${nota}:${linha}`, "utf8")
        .digest("hex")
        .slice(0, 16);

    const avaliacaoIdRaw = String(reg.avaliacao_id || "").trim();
    const avaliacaoId =
      avaliacaoIdRaw ||
      `H-${crypto
        .createHash("sha256")
        .update(`${sku}:${usuarioHash}:${criadoIso}`, "utf8")
        .digest("hex")
        .slice(0, 16)}`;

    const pedidoId = String(reg.pedido_id || "").trim() || null;

    validados.push({
      avaliacaoId,
      pedidoId,
      usuarioHash,
      sku,
      nota,
      comentario,
      criadoEm: criadoEmDate,
      updatedAt: updatedAtDate,
      linha,
    });
  }

  if (erros.length > 0) {
    throw new Error(
      `Validação das avaliações falhou com ${erros.length} erro(s). Nada foi gravado:\n- ${erros.join("\n- ")}`,
    );
  }

  return validados;
}

async function executar() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      `postgresql://${process.env.POSTGRES_USER || "postgres"}:${process.env.POSTGRES_PASSWORD || "postgres"}@localhost:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || "horizonte"}`,
    ssl: opcaoSslBanco(),
  });

  try {
    const caminho = resolverCaminhoCsv(process.argv[2]);
    console.log(`Lendo avaliações históricas de: ${caminho}`);

    const conteudo = fs.readFileSync(caminho, "utf8");
    const { cabecalho, registros } = parseCsvRfc4180(conteudo);
    const avaliacoes = validarRegistrosAvaliacoes(cabecalho, registros);

    const client = await pool.connect();
    try {
      const skusUnicos = [...new Set(avaliacoes.map((a) => a.sku))];
      const prodRes = await client.query(
        "SELECT sku FROM loja.produtos WHERE sku = ANY($1);",
        [skusUnicos],
      );
      const skusExistentes = new Set(prodRes.rows.map((r) => r.sku));
      const skusFaltantes = avaliacoes
        .filter((a) => !skusExistentes.has(a.sku))
        .map((a) => `Linha ${a.linha}: SKU "${a.sku}" não existe no catálogo.`);

      if (skusFaltantes.length > 0) {
        throw new Error(
          `SKUs inexistentes encontrados. Abortando sem gravar nada:\n- ${skusFaltantes.join("\n- ")}`,
        );
      }

      await client.query("BEGIN;");
      for (const av of avaliacoes) {
        await client.query(
          `INSERT INTO loja.avaliacoes (
             avaliacao_id, pedido_id, usuario_id, usuario_hash, sku, nota, comentario, origem, criado_em, updated_at
           ) VALUES (
             $1, $2, NULL, $3, $4, $5, $6, 'HISTORICO', $7, $8
           )
           ON CONFLICT (avaliacao_id) DO UPDATE SET
             pedido_id = EXCLUDED.pedido_id,
             usuario_hash = EXCLUDED.usuario_hash,
             sku = EXCLUDED.sku,
             nota = EXCLUDED.nota,
             comentario = EXCLUDED.comentario,
             origem = 'HISTORICO',
             criado_em = EXCLUDED.criado_em,
             updated_at = EXCLUDED.updated_at;`,
          [
            av.avaliacaoId,
            av.pedidoId,
            av.usuarioHash,
            av.sku,
            av.nota,
            av.comentario,
            av.criadoEm,
            av.updatedAt,
          ],
        );
      }
      await client.query("COMMIT;");

      const totalRes = await client.query(
        "SELECT count(*)::int AS total FROM loja.avaliacoes;",
      );
      console.log(
        `Seed de avaliações concluído: ${avaliacoes.length} processada(s), ${totalRes.rows[0].total} no banco.`,
      );
    } catch (erro) {
      await client.query("ROLLBACK;").catch(() => {});
      throw erro;
    } finally {
      client.release();
    }
  } catch (erro) {
    console.error("Erro no carregador de avaliações:", erro.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

await executar();
