import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../src/db.js";

const DIRETORIO_MIGRACOES = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../db/migrations",
);
const CHAVE_TRAVA = 7203115; // Impede duas execuções simultâneas do migrador

function listarMigracoes() {
  return fs
    .readdirSync(DIRETORIO_MIGRACOES)
    .filter((nome) => /^\d{3}_[\w-]+\.sql$/.test(nome))
    .sort()
    .map((nome) => {
      const sql = fs.readFileSync(path.join(DIRETORIO_MIGRACOES, nome), "utf8");
      // Normaliza fim de linha para o checksum não variar entre Windows e Linux
      const checksum = crypto
        .createHash("sha256")
        .update(sql.replace(/\r\n/g, "\n"))
        .digest("hex");
      return { nome, sql, checksum };
    });
}

async function aplicarMigracao(client, { nome, sql, checksum }) {
  await client.query("BEGIN");
  try {
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query(sql);
    await client.query(
      "INSERT INTO public.schema_migracoes (nome, checksum) VALUES ($1, $2)",
      [nome, checksum],
    );
    await client.query("COMMIT");
  } catch (erro) {
    await client.query("ROLLBACK");
    throw new Error(`Falha na migração ${nome}: ${erro.message}`);
  }
}

async function migrar() {
  const client = await pool.connect();
  try {
    // Migrações podem passar do limite de tempo das consultas da API
    await client.query("SET statement_timeout = 0");
    await client.query("SELECT pg_advisory_lock($1)", [CHAVE_TRAVA]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migracoes (
        nome       TEXT PRIMARY KEY,
        checksum   TEXT NOT NULL,
        aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query("SELECT nome, checksum FROM public.schema_migracoes");
    const aplicadas = new Map(rows.map((r) => [r.nome, r.checksum]));

    let novas = 0;
    for (const migracao of listarMigracoes()) {
      const checksumAplicado = aplicadas.get(migracao.nome);
      if (checksumAplicado === migracao.checksum) {
        console.log(`[ok] ${migracao.nome} já aplicada`);
        continue;
      }
      if (checksumAplicado) {
        throw new Error(
          `A migração ${migracao.nome} foi alterada depois de aplicada. Crie uma nova migração.`,
        );
      }
      await aplicarMigracao(client, migracao);
      novas += 1;
      console.log(`[nova] ${migracao.nome} aplicada`);
    }

    console.log(`Migrações concluídas: ${novas} nova(s).`);
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [CHAVE_TRAVA]).catch(() => {});
    client.release();
  }
}

try {
  await migrar();
} catch (erro) {
  console.error(erro.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
