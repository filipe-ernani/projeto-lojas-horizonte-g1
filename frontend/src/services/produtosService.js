import { apiFetch } from "./api.js";
import {
  mapearCategorias,
  mapearListaProdutos,
  mapearProduto,
  mapearAvaliacoes,
} from "./mapeadores.js";

/**
 * Consulta a lista completa de categorias do catálogo (/api/categorias).
 */
export async function listarCategorias(opcoes = {}) {
  const resposta = await apiFetch("/api/categorias", opcoes);
  return mapearCategorias(resposta);
}

/**
 * Consulta produtos com filtros, busca textual, paginação e ordenação (/api/produtos).
 */
export async function listarProdutos(filtros = {}, opcoes = {}) {
  const params = new URLSearchParams();

  if (filtros.categoria) params.set("categoria", filtros.categoria);
  if (filtros.busca) params.set("busca", filtros.busca);
  if (filtros.tamanho) params.set("tamanho", filtros.tamanho);
  if (filtros.precoMin !== undefined && filtros.precoMin !== null && filtros.precoMin !== "") {
    params.set("precoMin", String(filtros.precoMin));
  }
  if (filtros.precoMax !== undefined && filtros.precoMax !== null && filtros.precoMax !== "") {
    params.set("precoMax", String(filtros.precoMax));
  }
  if (filtros.pagina) params.set("pagina", String(filtros.pagina));
  if (filtros.limite) params.set("limite", String(filtros.limite));
  if (filtros.ordenar) params.set("ordenar", filtros.ordenar);

  const queryString = params.toString();
  const caminho = queryString ? `/api/produtos?${queryString}` : "/api/produtos";

  const resposta = await apiFetch(caminho, opcoes);
  return mapearListaProdutos(resposta);
}

/**
 * Consulta um produto pelo identificador público (SKU) (/api/produtos/:id).
 */
export async function obterProduto(id, opcoes = {}) {
  if (!id) {
    const erro = new Error("Identificador do produto não informado.");
    erro.status = 400;
    throw erro;
  }

  const resposta = await apiFetch(`/api/produtos/${encodeURIComponent(id)}`, opcoes);
  return mapearProduto(resposta);
}

/**
 * Consulta produtos semelhantes ao informado (/api/produtos/:id/semelhantes).
 */
export async function semelhantes(id, opcoes = {}) {
  if (!id) return [];
  const resposta = await apiFetch(
    `/api/produtos/${encodeURIComponent(id)}/semelhantes`,
    opcoes,
  );
  return Array.isArray(resposta) ? resposta.map(mapearProduto) : [];
}

/**
 * Consulta avaliações e resumo estatístico de um produto (/api/produtos/:id/avaliacoes).
 */
export async function avaliacoes(id, opcoes = {}) {
  if (!id) {
    return mapearAvaliacoes(null);
  }
  const resposta = await apiFetch(
    `/api/produtos/${encodeURIComponent(id)}/avaliacoes`,
    opcoes,
  );
  return mapearAvaliacoes(resposta);
}

export default {
  listarCategorias,
  listarProdutos,
  obterProduto,
  semelhantes,
  avaliacoes,
};
