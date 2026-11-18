/**
 * Mapeadores centrais para normalizar dados da API do Horizonte.
 * Se algum campo da API tiver formato ou nome diferente do esperado pela interface,
 * a adaptação é realizada exclusivamente neste arquivo (regra 5 da tarefa 4A).
 */

/**
 * Normaliza um produto retornado pela API para a estrutura esperada pelos componentes da UI.
 */
export function mapearProduto(apiProduto) {
  if (!apiProduto || typeof apiProduto !== "object") {
    return null;
  }

  const id = apiProduto.id || apiProduto.sku || "";
  const sku = apiProduto.sku || apiProduto.id || "";

  return {
    id,
    sku,
    nome: apiProduto.nome || "",
    modelo: apiProduto.modelo || null,
    descricao: apiProduto.descricao || null,
    categoria: apiProduto.categoria || "",
    preco:
      typeof apiProduto.preco === "number"
        ? apiProduto.preco
        : Number(apiProduto.preco) || 0,
    imagemUrl: apiProduto.imagemUrl || null,
    imagens:
      Array.isArray(apiProduto.imagens) && apiProduto.imagens.length > 0
        ? apiProduto.imagens
        : apiProduto.imagemUrl
          ? [apiProduto.imagemUrl]
          : [],
    tamanhos: Array.isArray(apiProduto.tamanhos) ? apiProduto.tamanhos : [],
    cores: Array.isArray(apiProduto.cores) ? apiProduto.cores : [],
    notaMedia: apiProduto.notaMedia ?? null,
    qtdAvaliacoes: apiProduto.qtdAvaliacoes ?? 0,
  };
}

/**
 * Normaliza o payload de listagem paginada da API (/api/produtos).
 */
export function mapearListaProdutos(resposta) {
  if (!resposta || typeof resposta !== "object") {
    return { itens: [], total: 0, pagina: 1, limite: 12 };
  }

  const listaOriginal = Array.isArray(resposta.itens)
    ? resposta.itens
    : Array.isArray(resposta)
      ? resposta
      : [];

  const itens = listaOriginal.map(mapearProduto).filter(Boolean);

  return {
    itens,
    total: typeof resposta.total === "number" ? resposta.total : itens.length,
    pagina: typeof resposta.pagina === "number" ? resposta.pagina : 1,
    limite: typeof resposta.limite === "number" ? resposta.limite : itens.length,
  };
}

/**
 * Normaliza a lista de categorias (/api/categorias).
 */
export function mapearCategorias(resposta) {
  if (!resposta) return [];
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta.categorias)) return resposta.categorias;
  return [];
}

/**
 * Normaliza a resposta de avaliações do produto (/api/produtos/:id/avaliacoes).
 */
export function mapearAvaliacoes(resposta) {
  if (!resposta || typeof resposta !== "object") {
    return {
      resumo: {
        notaMedia: null,
        total: 0,
        distribuicao: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
      itens: [],
      notaMedia: null,
      qtdAvaliacoes: 0,
    };
  }

  const resumoOriginal = resposta.resumo || {};
  const total = typeof resumoOriginal.total === "number" ? resumoOriginal.total : 0;
  const notaMedia = resumoOriginal.notaMedia !== undefined ? resumoOriginal.notaMedia : null;

  return {
    resumo: {
      notaMedia,
      total,
      distribuicao: resumoOriginal.distribuicao || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    },
    itens: Array.isArray(resposta.itens) ? resposta.itens : [],
    notaMedia,
    qtdAvaliacoes: total,
  };
}
