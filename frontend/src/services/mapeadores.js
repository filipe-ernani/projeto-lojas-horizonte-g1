/**
 * Mapeadores centrais para normalizar dados da API do Horizonte.
 * Se algum campo da API tiver formato ou nome diferente do esperado pela interface,
 * a adaptação é realizada exclusivamente neste arquivo (regra 5 da tarefa 4A).
 */

import { ApiError } from "./api";

/**
 * Resposta 200 com formato inesperado é falha, nunca lista vazia.
 */
function erroFormatoInesperado(resposta) {
  return new ApiError("Resposta inesperada do servidor.", 200, resposta);
}

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
    tipo: apiProduto.tipo || null,
    variacao: apiProduto.variacao || null,
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
    cor: apiProduto.cor ?? null,
    corHex: apiProduto.corHex ?? null,
    tamanhos: Array.isArray(apiProduto.tamanhos) ? apiProduto.tamanhos : [],
    cores: Array.isArray(apiProduto.cores) ? apiProduto.cores : [],
    ocasioes: Array.isArray(apiProduto.ocasioes)
      ? apiProduto.ocasioes.filter(Boolean)
      : [],
    notaMedia: apiProduto.notaMedia ?? null,
    totalAvaliacoes: Number(apiProduto.totalAvaliacoes ?? apiProduto.qtdAvaliacoes ?? 0) || 0,
    qtdAvaliacoes: Number(apiProduto.totalAvaliacoes ?? apiProduto.qtdAvaliacoes ?? 0) || 0,
  };
}

/**
 * Normaliza o payload de listagem paginada da API (/api/produtos).
 */
export function mapearListaProdutos(resposta) {
  const listaOriginal = Array.isArray(resposta) ? resposta : resposta?.itens;
  if (!Array.isArray(listaOriginal)) {
    throw erroFormatoInesperado(resposta);
  }

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
 * Normaliza uma avaliação individual.
 */
export function mapAvaliacao(item) {
  if (!item || typeof item !== "object") return null;

  return {
    id: item.id || item.avaliacao_id || "",
    nota: Number(item.nota) || 0,
    comentario: item.comentario ?? null,
    autor: item.autor || "Cliente Horizonte",
    criadoEm: item.criadoEm || null,
    dataLocal: item.dataLocal || item.criadoEm || item.data || null,
    updatedAt: item.updatedAt || null,
  };
}

/**
 * Normaliza um item pendente de avaliação (/api/avaliacoes/pendentes).
 */
export function mapAvaliacaoPendente(item) {
  if (!item || typeof item !== "object") return null;

  return {
    sku: item.sku || item.produtoId || "",
    nome: item.nome || "",
    tipo: item.tipo || null,
    cor: item.cor || null,
    corHex: item.corHex || null,
    pedidoId: item.pedidoId || null,
    finalizadoEm: item.finalizadoEm || null,
  };
}

/**
 * Normaliza a resposta de avaliações do produto (/api/produtos/:id/avaliacoes).
 */
export function mapearAvaliacoes(resposta) {
  if (!resposta || typeof resposta !== "object") {
    return {
      resumo: {
        media: null,
        notaMedia: null,
        total: 0,
        distribuicao: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
      itens: [],
      notaMedia: null,
      totalAvaliacoes: 0,
      qtdAvaliacoes: 0,
    };
  }

  const resumoOriginal = resposta.resumo || {};
  const total = typeof resumoOriginal.total === "number" ? resumoOriginal.total : 0;
  const media =
    resumoOriginal.media !== undefined
      ? resumoOriginal.media
      : resumoOriginal.notaMedia !== undefined
        ? resumoOriginal.notaMedia
        : null;
  const itens = Array.isArray(resposta.itens)
    ? resposta.itens.map(mapAvaliacao).filter(Boolean)
    : [];

  return {
    resumo: {
      media,
      notaMedia: media,
      total,
      distribuicao: resumoOriginal.distribuicao || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    },
    itens,
    notaMedia: media,
    totalAvaliacoes: total,
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
    tipo: item.tipo || null,
    variacao: item.variacao || null,
    ocasioes: Array.isArray(item.ocasioes)
      ? item.ocasioes.filter(Boolean)
      : [],
    preco:
      typeof item.preco === "number"
        ? item.preco
        : Number(item.preco) || 0,
    imagemUrl: item.imagemUrl || null,
    tamanho: item.tamanho || null,
    cor: item.cor || null,
    corHex: item.corHex || null,
    quantidade: Math.max(1, Number(item.quantidade) || 1),
  };
}

/**
 * Normaliza o payload do carrinho (/api/carrinho).
 */
export function mapearCarrinho(resposta) {
  if (!Array.isArray(resposta?.itens)) {
    throw erroFormatoInesperado(resposta);
  }

  const itens = resposta.itens.map(mapearItemCarrinho).filter(Boolean);
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
  if (!Array.isArray(resposta)) {
    throw erroFormatoInesperado(resposta);
  }

  return resposta
    .map((item) => {
      const produto = mapearProduto(item);
      return produto ? { ...produto, corHex: item.corHex || null } : null;
    })
    .filter(Boolean);
}

/**
 * Normaliza os dados do Pix SIMULADO, presentes só na resposta de finalização com PIX.
 */
function mapearPix(pix) {
  if (!pix || typeof pix !== "object") return null;

  return {
    chave: pix.chave || "",
    codigoCopiaECola: pix.codigoCopiaECola || "",
    expiraEm: pix.expiraEm || null,
    origem: pix.origem || "SIMULADO",
  };
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
    formaPagamento: p.formaPagamento || null,
    parcelas: Number(p.parcelas) || 1,
    valorParcela:
      p.valorParcela === undefined || p.valorParcela === null
        ? null
        : Number(p.valorParcela),
    pix: mapearPix(p.pix),
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
  if (!Array.isArray(resposta)) {
    throw erroFormatoInesperado(resposta);
  }
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
  if (!Array.isArray(resposta)) {
    throw erroFormatoInesperado(resposta);
  }
  return resposta.map(mapearEndereco).filter(Boolean);
}
