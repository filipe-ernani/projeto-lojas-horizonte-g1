import { query } from "../db.js";

export function formatarProduto(p) {
  if (!p) return null;

  return {
    id: p.sku, // Decisão D-22: id público é o SKU
    sku: p.sku,
    nome: p.nome,
    modelo: p.modelo || null,
    descricao: p.descricao || null,
    categoria: p.categoria,
    preco: Number(p.preco),
    imagemUrl: p.imagem_url || null,
    tamanhos: p.tamanhos || [],
    cores: typeof p.cores === "string" ? JSON.parse(p.cores) : p.cores || [],
    notaMedia: null,
    qtdAvaliacoes: 0,
  };
}

export async function listarCategoriasQuery() {
  const resultado = await query(
    "SELECT DISTINCT categoria FROM loja.produtos ORDER BY categoria ASC;",
  );
  return resultado.rows.map((r) => r.categoria);
}

export async function listarProdutosQuery({
  categoria,
  busca,
  tamanho,
  precoMin,
  precoMax,
  pagina = 1,
  limite = 12,
  ordenar = "relevancia",
}) {
  const numPagina = Math.max(1, Number(pagina) || 1);
  const numLimite = Math.min(48, Math.max(1, Number(limite) || 12));
  const offset = (numPagina - 1) * numLimite;

  const condicoes = [];
  const params = [];

  if (categoria) {
    params.push(categoria);
    condicoes.push(`categoria = $${params.length}`);
  }

  if (busca) {
    params.push(`%${busca}%`);
    const pIdx = params.length;
    condicoes.push(
      `(nome ILIKE $${pIdx} OR modelo ILIKE $${pIdx} OR categoria ILIKE $${pIdx})`,
    );
  }

  if (tamanho) {
    params.push(tamanho);
    condicoes.push(`$${params.length} = ANY(tamanhos)`);
  }

  if (precoMin !== undefined && precoMin !== null && precoMin !== "") {
    params.push(Number(precoMin));
    condicoes.push(`preco >= $${params.length}`);
  }

  if (precoMax !== undefined && precoMax !== null && precoMax !== "") {
    params.push(Number(precoMax));
    condicoes.push(`preco <= $${params.length}`);
  }

  const whereClause = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";

  // Ordenação com consultas parametrizadas seguras
  let orderClause = "ORDER BY popularidade DESC, sku ASC";
  if (ordenar === "menor-preco") {
    orderClause = "ORDER BY preco ASC, sku ASC";
  } else if (ordenar === "maior-preco") {
    orderClause = "ORDER BY preco DESC, sku ASC";
  } else if (ordenar === "recentes") {
    orderClause = "ORDER BY ordem DESC, sku ASC"; // D-25
  } else if (ordenar === "melhor-avaliados") {
    orderClause = "ORDER BY popularidade DESC, sku ASC";
  }

  const countQuery = `SELECT count(*)::int as total FROM loja.produtos ${whereClause};`;
  const countRes = await query(countQuery, params);
  const total = countRes.rows[0]?.total || 0;

  const dataParams = [...params, numLimite, offset];
  const dataQuery = `
    SELECT * FROM loja.produtos
    ${whereClause}
    ${orderClause}
    LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length};
  `;

  const dataRes = await query(dataQuery, dataParams);
  const itens = dataRes.rows.map(formatarProduto);

  return {
    itens,
    total,
    pagina: numPagina,
    limite: numLimite,
  };
}

export async function buscarProdutoPorSkuQuery(sku) {
  const res = await query(
    "SELECT * FROM loja.produtos WHERE sku = $1 LIMIT 1;",
    [sku],
  );
  if (res.rows.length === 0) return null;
  return formatarProduto(res.rows[0]);
}

export async function buscarSemelhantesQuery(sku, categoria, limite = 4) {
  const res = await query(
    `SELECT * FROM loja.produtos
     WHERE categoria = $1 AND sku <> $2
     ORDER BY popularidade DESC, sku ASC
     LIMIT $3;`,
    [categoria, sku, limite],
  );
  return res.rows.map(formatarProduto);
}
