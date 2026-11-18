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

/**
 * Normaliza um item do carrinho.
 */
export function mapearItemCarrinho(item) {
  if (!item || typeof item !== "object") return null;
  const sku = item.produtoId || item.sku || "";

  return {
    produtoId: sku,
    sku,
    nome: item.nome || "",
    preco:
      typeof item.preco === "number"
        ? item.preco
        : Number(item.preco) || 0,
    imagemUrl: item.imagemUrl || null,
    tamanho: item.tamanho || null,
    cor: item.cor || null,
    quantidade: Math.max(1, Number(item.quantidade) || 1),
  };
}

/**
 * Normaliza o payload do carrinho (/api/carrinho).
 */
export function mapearCarrinho(resposta) {
  if (!resposta || typeof resposta !== "object") {
    return { itens: [], subtotal: 0, frete: 0, total: 0 };
  }

  const listaOriginal = Array.isArray(resposta.itens) ? resposta.itens : [];
  const itens = listaOriginal.map(mapearItemCarrinho).filter(Boolean);
  const subtotal =
    typeof resposta.subtotal === "number"
      ? resposta.subtotal
      : Number(resposta.subtotal) || 0;
  const frete =
    typeof resposta.frete === "number"
      ? resposta.frete
      : Number(resposta.frete) || 0;
  const total =
    typeof resposta.total === "number"
      ? resposta.total
      : Number(resposta.total) || 0;

  return {
    itens,
    subtotal,
    frete,
    total,
  };
}

/**
 * Normaliza a lista de produtos favoritados (/api/favoritos).
 */
export function mapearFavoritos(resposta) {
  if (!Array.isArray(resposta)) return [];
  return resposta.map(mapearProduto).filter(Boolean);
}

/**
 * Normaliza um pedido (/api/pedidos/meus ou /api/carrinho/finalizar).
 */
export function mapearPedido(p) {
  if (!p || typeof p !== "object") return null;

  const itens = Array.isArray(p.itens)
    ? p.itens.map(mapearItemCarrinho).filter(Boolean)
    : [];

  return {
    id: Number(p.id) || 0,
    data: p.data || "",
    dataIso: p.dataIso || null,
    dataLocal: p.dataLocal || null,
    criadoEm: p.criadoEm || null,
    criadoEmLocal: p.criadoEmLocal || null,
    finalizadoEm: p.finalizadoEm || null,
    finalizadoEmLocal: p.finalizadoEmLocal || null,
    canceladoEm: p.canceladoEm || null,
    canceladoEmLocal: p.canceladoEmLocal || null,
    status: p.status || "FINALIZADO",
    total:
      typeof p.total === "number" ? p.total : Number(p.valor_total || p.total) || 0,
    qtdItens:
      typeof p.qtdItens === "number"
        ? p.qtdItens
        : itens.reduce((acc, i) => acc + i.quantidade, 0),
    itens,
    enderecoResumo: p.enderecoResumo || "",
  };
}

/**
 * Normaliza a lista de pedidos do usuário (/api/pedidos/meus).
 */
export function mapearPedidos(resposta) {
  if (!Array.isArray(resposta)) return [];
  return resposta.map(mapearPedido).filter(Boolean);
}

/**
 * Normaliza os dados do perfil do usuário (/api/usuarios/perfil).
 */
export function mapearPerfil(p) {
  if (!p || typeof p !== "object") {
    return {
      nome: "",
      email: "",
      telefone: "",
      criadoEm: null,
      dataLocal: null,
      updatedAt: null,
      updatedAtLocal: null,
    };
  }

  return {
    nome: p.nome || "",
    email: p.email || "",
    telefone: p.telefone || "",
    criadoEm: p.criadoEm || null,
    dataLocal: p.dataLocal || null,
    updatedAt: p.updatedAt || null,
    updatedAtLocal: p.updatedAtLocal || null,
  };
}

/**
 * Normaliza um endereço do usuário.
 */
export function mapearEndereco(e) {
  if (!e || typeof e !== "object") return null;

  return {
    id: Number(e.id) || 0,
    apelido: e.apelido || "",
    cep: e.cep || "",
    logradouro: e.logradouro || "",
    numero: String(e.numero ?? ""),
    complemento: e.complemento || "",
    bairro: e.bairro || "",
    cidade: e.cidade || "",
    uf: String(e.uf || "").toUpperCase(),
    padrao: Boolean(e.padrao),
  };
}

/**
 * Normaliza a lista de endereços do usuário (/api/enderecos).
 */
export function mapearEnderecos(resposta) {
  if (!Array.isArray(resposta)) return [];
  return resposta.map(mapearEndereco).filter(Boolean);
}
