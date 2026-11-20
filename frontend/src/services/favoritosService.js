import apiFetch from "./api";
import { mapearFavoritos } from "./mapeadores";

/**
 * Lista todos os produtos favoritados pelo usuário autenticado (/api/favoritos).
 */
export async function listarFavoritos(opcoes = {}) {
  const resposta = await apiFetch("/api/favoritos", {
    method: "GET",
    signal: opcoes.signal,
  });
  return mapearFavoritos(resposta);
}

/**
 * Adiciona um produto aos favoritos do usuário (/api/favoritos/:produtoId).
 */
export async function adicionarFavorito(sku, opcoes = {}) {
  const skuNormalizado = encodeURIComponent(String(sku || "").trim());
  await apiFetch(`/api/favoritos/${skuNormalizado}`, {
    method: "PUT",
    signal: opcoes.signal,
  });
  return true;
}

/**
 * Remove um produto dos favoritos do usuário (/api/favoritos/:produtoId).
 */
export async function removerFavorito(sku, opcoes = {}) {
  const skuNormalizado = encodeURIComponent(String(sku || "").trim());
  await apiFetch(`/api/favoritos/${skuNormalizado}`, {
    method: "DELETE",
    signal: opcoes.signal,
  });
  return true;
}
