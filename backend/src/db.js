import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";
import { opcaoSslBanco } from "./dbConfig.js";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    `postgresql://${process.env.POSTGRES_USER || "postgres"}:${process.env.POSTGRES_PASSWORD || "postgres"}@localhost:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || "horizonte"}`,
  ssl: opcaoSslBanco(),
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  statement_timeout: 30000,
});

// Falha em conexão ociosa não pode derrubar o processo da API
pool.on("error", (erro) => {
  console.error("Erro em conexão ociosa do banco:", {
    tipo: erro.name,
    codigo: erro.code ?? null,
    mensagem: erro.message,
  });
});

export async function query(text, params) {
  return pool.query(text, params);
}
