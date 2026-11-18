import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { pool } from "../src/db.js";
import {
  converterParaCsv,
  exportarEventosQuery,
  exportarPedidoItensQuery,
  exportarPedidosQuery,
} from "../src/queries/integracaoQueries.js";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config();

const COLUNAS_PEDIDOS = [
  "pedido_id", "usuario_hash", "status", "forma_pagamento",
  "subtotal", "frete", "valor_total", "finalizado_em", "cancelado_em", "updated_at", "origem",
];

const COLUNAS_PEDIDO_ITENS = [
  "item_id", "pedido_id", "sku", "quantidade", "preco_unitario", "tamanho", "cor", "updated_at", "origem",
];

const COLUNAS_EVENTOS = [
  "evento_id", "evento", "ocorrido_em", "sessao_id", "usuario_hash",
  "sku", "quantidade", "valor", "pedido_id", "updated_at", "origem",
];

function obterDiretorioExports() {
  const base = process.cwd().endsWith("backend")
    ? process.cwd()
    : path.resolve(process.cwd(), "backend");
  const dir = path.join(base, "exports");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function carregarMarcas(dir) {
  const arquivoMarca = path.join(dir, ".marca.json");
  if (fs.existsSync(arquivoMarca)) {
    try {
      return JSON.parse(fs.readFileSync(arquivoMarca, "utf8"));
    } catch {
      // Ignora erro de leitura e inicia vazio
    }
  }
  return { pedidos: null, pedidoItens: null, eventos: null };
}

function salvarMarcas(dir, marcas) {
  const arquivoMarca = path.join(dir, ".marca.json");
  fs.writeFileSync(arquivoMarca, JSON.stringify(marcas, null, 2), "utf8");
}

async function exportarNovos() {
  const args = process.argv.slice(2);
  let desdeParam = null;
  const idx = args.indexOf("--desde");
  if (idx !== -1 && args[idx + 1]) {
    desdeParam = args[idx + 1];
  }

  const dirExports = obterDiretorioExports();
  const marcas = carregarMarcas(dirExports);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  console.log(`Iniciando exportação incremental para ${dirExports}`);
  if (desdeParam) console.log(`Reprocessamento solicitado com --desde: ${desdeParam}`);

  const tarefas = [
    {
      tipo: "pedidos",
      colunas: COLUNAS_PEDIDOS,
      queryFn: exportarPedidosQuery,
      marcaAtual: desdeParam || marcas.pedidos,
    },
    {
      tipo: "pedido_itens",
      colunas: COLUNAS_PEDIDO_ITENS,
      queryFn: exportarPedidoItensQuery,
      marcaAtual: desdeParam || marcas.pedidoItens,
    },
    {
      tipo: "eventos",
      colunas: COLUNAS_EVENTOS,
      queryFn: exportarEventosQuery,
      marcaAtual: desdeParam || marcas.eventos,
    },
  ];

  for (const t of tarefas) {
    const res = await t.queryFn(t.marcaAtual, 20000);
    // Filtra itens já exportados exatamente na marca anterior
    const itensNovos = t.marcaAtual && !desdeParam
      ? res.itens.filter((i) => i.updated_at > t.marcaAtual)
      : res.itens;

    const arquivoSaida = path.join(dirExports, `${t.tipo}_${timestamp}.csv`);
    const csv = converterParaCsv(t.colunas, itensNovos);
    fs.writeFileSync(arquivoSaida, csv, "utf8");

    console.log(
      `[${t.tipo}] ${itensNovos.length} novos registros exportados em: ${path.basename(arquivoSaida)}`,
    );

    if (res.proximoDesde) {
      marcas[t.tipo === "pedido_itens" ? "pedidoItens" : t.tipo] = res.proximoDesde;
    }
  }

  if (!desdeParam) {
    salvarMarcas(dirExports, marcas);
  }

  await pool.end();
  console.log("Exportação incremental finalizada com sucesso!");
}

exportarNovos().catch(async (err) => {
  console.error("Erro na exportação de novos registros:", err);
  await pool.end();
  process.exit(1);
});
