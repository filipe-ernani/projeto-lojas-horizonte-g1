import { query } from "../db.js";

export function formatarProduto(p) {
  if (!p) return null;

  const coresLista =
    typeof p.cores === "string" ? JSON.parse(p.cores) : p.cores || [];
  const primeiraCor = coresLista[0] || null;

  return {
    id: p.sku, // Decisão D-22: id público é o SKU
    sku: p.sku,
    nome: p.nome,
    modelo: p.modelo || null,
    tipo: p.tipo || null,
    variacao: p.variacao || null,
    descricao: p.descricao || null,
    categoria: p.categoria,
    preco: Number(p.preco),
    imagemUrl: p.imagem_url || null,
    cor: primeiraCor?.nome || null,
    corHex: primeiraCor?.hex || null,
    tamanhos: p.tamanhos || [],
    cores: coresLista,
    ocasioes: Array.isArray(p.ocasioes)
      ? p.ocasioes
      : p.ocasioes
        ? [p.ocasioes]
        : [],
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

const ORDENACOES_VALIDAS = new Set([
  "relevancia",
  "menor-preco",
  "maior-preco",
  "recentes",
  "novidades",
  "melhor-avaliados",
]);
const LIMITE_MAXIMO_PAGINA = 48;
const TAMANHO_MAXIMO_FILTRO = 100;

function filtroVazio(valor) {
  return valor === undefined || valor === null || valor === "";
}

function lerInteiroPositivo(valor, padrao) {
  if (filtroVazio(valor)) return padrao;
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) return null;
  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero >= 1 ? numero : null;
}

function lerPreco(valor) {
  if (filtroVazio(valor)) return undefined;
  if (typeof valor !== "string" || !/^\d+(\.\d+)?$/.test(valor)) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Valida os filtros de GET /api/produtos.
 * Devolve { erro } quando algum filtro é inválido, ou { dados } normalizados.
 */
export function validarFiltrosProdutos(filtros = {}) {
  const { categoria, busca, tamanho, ordenar } = filtros;

  for (const [nome, valor] of Object.entries({ categoria, busca, tamanho })) {
    if (filtroVazio(valor)) continue;
    if (
      typeof valor !== "string" ||
      valor.includes("\0") ||
      valor.length > TAMANHO_MAXIMO_FILTRO
    ) {
      return { erro: `Filtro '${nome}' inválido.` };
    }
  }

  const pagina = lerInteiroPositivo(filtros.pagina, 1);
  if (pagina === null) {
    return { erro: "Filtro 'pagina' inválido. Use um número inteiro a partir de 1." };
  }

  const limite = lerInteiroPositivo(filtros.limite, 12);
  if (limite === null) {
    return { erro: "Filtro 'limite' inválido. Use um número inteiro a partir de 1." };
  }
  const limiteFinal = Math.min(LIMITE_MAXIMO_PAGINA, limite);

  if (!Number.isSafeInteger((pagina - 1) * limiteFinal)) {
    return { erro: "Filtro 'pagina' inválido. Use um número menor." };
  }

  const precoMin = lerPreco(filtros.precoMin);
  if (precoMin === null) {
    return { erro: "Filtro 'precoMin' inválido. Use um número maior ou igual a zero." };
  }

  const precoMax = lerPreco(filtros.precoMax);
  if (precoMax === null) {
    return { erro: "Filtro 'precoMax' inválido. Use um número maior ou igual a zero." };
  }

  if (precoMin !== undefined && precoMax !== undefined && precoMin > precoMax) {
    return { erro: "O filtro 'precoMin' não pode ser maior que 'precoMax'." };
  }

  const ordenarFinal = filtroVazio(ordenar) ? "relevancia" : ordenar;
  if (!ORDENACOES_VALIDAS.has(ordenarFinal)) {
    return { erro: "Filtro 'ordenar' inválido." };
  }

  return {
    dados: {
      categoria,
      busca,
      tamanho,
      precoMin,
      precoMax,
      pagina,
      limite: limiteFinal,
      ordenar: ordenarFinal,
    },
  };
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
  const numPagina = pagina;
  const numLimite = limite;
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
      `(nome ILIKE $${pIdx} OR modelo ILIKE $${pIdx} OR categoria ILIKE $${pIdx} OR descricao ILIKE $${pIdx} OR tipo ILIKE $${pIdx})`,
    );
  }

  if (tamanho) {
    params.push(tamanho);
    condicoes.push(`$${params.length} = ANY(tamanhos)`);
  }

  if (precoMin !== undefined) {
    params.push(precoMin);
    condicoes.push(`preco >= $${params.length}`);
  }

  if (precoMax !== undefined) {
    params.push(precoMax);
    condicoes.push(`preco <= $${params.length}`);
  }

  const whereClause = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";

  // D-25 (Correção): ordenar=novidades retorna o SKU mais recente de CADA categoria
  if (ordenar === "novidades") {
    const countQuery = `
      WITH novidades_cat AS (
        SELECT DISTINCT ON (categoria) *
        FROM loja.produtos
        ${whereClause}
        ORDER BY categoria, ordem DESC
      )
      SELECT count(*)::int as total FROM novidades_cat;
    `;
    const countRes = await query(countQuery, params);
    const total = countRes.rows[0]?.total || 0;

    const dataParams = [...params, numLimite, offset];
    const dataQuery = `
      WITH novidades_cat AS (
        SELECT DISTINCT ON (categoria) *
        FROM loja.produtos
        ${whereClause}
        ORDER BY categoria, ordem DESC
      )
      SELECT * FROM novidades_cat
      ORDER BY ordem DESC, sku ASC
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

  // Ordenações padrão da loja
  let orderClause = "ORDER BY popularidade DESC, sku ASC";
  if (ordenar === "menor-preco") {
    orderClause = "ORDER BY preco ASC, sku ASC";
  } else if (ordenar === "maior-preco") {
    orderClause = "ORDER BY preco DESC, sku ASC";
  } else if (ordenar === "recentes") {
    orderClause = "ORDER BY ordem DESC, sku ASC";
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
