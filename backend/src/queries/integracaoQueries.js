import { query } from "../db.js";

function formatarLinha(row) {
  const formatado = {};
  for (const [k, v] of Object.entries(row)) {
    if (v instanceof Date) {
      formatado[k] = v.toISOString();
    } else {
      formatado[k] = v;
    }
  }
  return formatado;
}

export function converterParaCsv(colunas, itens) {
  const cabecalho = colunas.join(",");
  const linhas = itens.map((item) =>
    colunas
      .map((col) => {
        const val = item[col];
        if (val === null || val === undefined) return "";
        if (val instanceof Date) return val.toISOString();
        const str = String(val);
        if (/[",\r\n]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      })
      .join(","),
  );
  return [cabecalho, ...linhas].join("\n");
}

export async function exportarPedidosQuery(desdeIso, limite) {
  const dataDesde = desdeIso ? new Date(desdeIso) : new Date(0);
  const res = await query(
    `SELECT * FROM loja.vw_export_pedidos
     WHERE updated_at >= $1
     ORDER BY updated_at ASC
     FETCH FIRST ($2::bigint) ROWS WITH TIES;`, // WITH TIES: não corta linhas de mesmo updated_at
    [dataDesde, limite],
  );

  const itens = res.rows.map(formatarLinha);
  const proximoDesde =
    itens.length > 0 ? itens[itens.length - 1].updated_at : null;

  return { itens, proximoDesde };
}

export async function exportarPedidoItensQuery(desdeIso, limite) {
  const dataDesde = desdeIso ? new Date(desdeIso) : new Date(0);
  const res = await query(
    `SELECT * FROM loja.vw_export_pedido_itens
     WHERE updated_at >= $1
     ORDER BY updated_at ASC
     FETCH FIRST ($2::bigint) ROWS WITH TIES;`,
    [dataDesde, limite],
  );

  const itens = res.rows.map(formatarLinha);
  const proximoDesde =
    itens.length > 0 ? itens[itens.length - 1].updated_at : null;

  return { itens, proximoDesde };
}

export async function exportarEventosQuery(desdeIso, limite) {
  const dataDesde = desdeIso ? new Date(desdeIso) : new Date(0);
  const res = await query(
    `SELECT * FROM loja.vw_export_analytics_eventos
     WHERE updated_at >= $1
     ORDER BY updated_at ASC
     FETCH FIRST ($2::bigint) ROWS WITH TIES;`,
    [dataDesde, limite],
  );

  const itens = res.rows.map(formatarLinha);
  const proximoDesde =
    itens.length > 0 ? itens[itens.length - 1].updated_at : null;

  return { itens, proximoDesde };
}

export async function exportarAvaliacoesQuery(desdeIso, limite) {
  const dataDesde = desdeIso ? new Date(desdeIso) : new Date(0);
  const res = await query(
    `SELECT * FROM loja.vw_export_avaliacoes
     WHERE updated_at >= $1
     ORDER BY updated_at ASC
     FETCH FIRST ($2::bigint) ROWS WITH TIES;`,
    [dataDesde, limite],
  );

  const itens = res.rows.map(formatarLinha);
  const proximoDesde =
    itens.length > 0 ? itens[itens.length - 1].updated_at : null;

  return { itens, proximoDesde };
}
