import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { pool } from "../src/db.js";
import {
  converterParaCsv,
  exportarAvaliacoesQuery,
  exportarEventosQuery,
  exportarPedidoItensQuery,
  exportarPedidosQuery,
} from "../src/queries/integracaoQueries.js";

dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config();

const COLUNAS_PEDIDOS = [
  "pedido_id", "usuario_hash", "status", "forma_pagamento",
  "subtotal", "frete", "valor_total", "finalizado_em", "cancelado_em", "updated_at", "origem",
  "parcelas",
];

const COLUNAS_PEDIDO_ITENS = [
  "item_id", "pedido_id", "sku", "quantidade", "preco_unitario", "tamanho", "cor", "updated_at", "origem",
];

const COLUNAS_EVENTOS = [
  "evento_id", "evento", "ocorrido_em", "sessao_id", "usuario_hash",
  "sku", "quantidade", "valor", "pedido_id", "updated_at", "origem",
];

const COLUNAS_AVALIACOES = [
  "avaliacao_id", "pedido_id", "usuario_hash", "sku",
  "nota", "comentario", "criado_em", "updated_at", "origem",
];

// Relê um trecho anterior à marca para alcançar transações confirmadas com atraso.
const JANELA_SOBREPOSICAO_MS = 5 * 60 * 1000;
const TAMANHO_PAGINA = 20000;

function recuarMarca(marca) {
  return new Date(new Date(marca).getTime() - JANELA_SOBREPOSICAO_MS).toISOString();
}

// Lê todas as páginas a partir de `desde`, mantendo uma única linha por ID.
async function buscarLinhas(queryFn, colunaId, desde) {
  const porId = new Map();
  let cursor = desde;
  let ultimaMarca = null;

  for (;;) {
    const { itens, proximoDesde } = await queryFn(cursor, TAMANHO_PAGINA);
    for (const item of itens) porId.set(item[colunaId], item);
    if (proximoDesde) ultimaMarca = proximoDesde;
    if (itens.length < TAMANHO_PAGINA) break;
    if (proximoDesde === cursor) {
      throw new Error(`Mais de ${TAMANHO_PAGINA} linhas no mesmo milissegundo em ${colunaId}.`);
    }
    cursor = proximoDesde;
  }

  return { itens: [...porId.values()], ultimaMarca };
}

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
  return { pedidos: null, pedidoItens: null, eventos: null, avaliacoes: null };
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
      chaveMarca: "pedidos",
      colunaId: "pedido_id",
      colunas: COLUNAS_PEDIDOS,
      queryFn: exportarPedidosQuery,
    },
    {
      tipo: "pedido_itens",
      chaveMarca: "pedidoItens",
      colunaId: "item_id",
      colunas: COLUNAS_PEDIDO_ITENS,
      queryFn: exportarPedidoItensQuery,
    },
    {
      tipo: "eventos",
      chaveMarca: "eventos",
      colunaId: "evento_id",
      colunas: COLUNAS_EVENTOS,
      queryFn: exportarEventosQuery,
    },
    {
      tipo: "avaliacoes",
      chaveMarca: "avaliacoes",
      colunaId: "avaliacao_id",
      colunas: COLUNAS_AVALIACOES,
      queryFn: exportarAvaliacoesQuery,
    },
  ];

  marcas.vistos ??= {};

  for (const t of tarefas) {
    const marcaAnterior = marcas[t.chaveMarca];
    const desde = desdeParam || (marcaAnterior ? recuarMarca(marcaAnterior) : null);
    const res = await buscarLinhas(t.queryFn, t.colunaId, desde);

    // Uma linha só é repetida se o ID e o updated_at forem os já exportados
    const vistos = desdeParam ? {} : marcas.vistos[t.chaveMarca] || {};
    const itensNovos = res.itens.filter((i) => vistos[i[t.colunaId]] !== i.updated_at);

    const arquivoSaida = path.join(dirExports, `${t.tipo}_${timestamp}.csv`);
    const csv = converterParaCsv(t.colunas, itensNovos);
    fs.writeFileSync(arquivoSaida, csv, "utf8");

    console.log(
      `[${t.tipo}] ${itensNovos.length} novos registros exportados em: ${path.basename(arquivoSaida)}`,
    );

    const novaMarca =
      marcaAnterior && (!res.ultimaMarca || new Date(marcaAnterior) > new Date(res.ultimaMarca))
        ? marcaAnterior
        : res.ultimaMarca;

    if (novaMarca) {
      marcas[t.chaveMarca] = novaMarca;
      // Guarda só o que a próxima execução voltará a ler dentro da janela
      const inicioJanela = new Date(recuarMarca(novaMarca));
      marcas.vistos[t.chaveMarca] = Object.fromEntries(
        res.itens
          .filter((i) => new Date(i.updated_at) >= inicioJanela)
          .map((i) => [i[t.colunaId], i.updated_at]),
      );
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
