import apiFetch from "./api";
import {
  mapAvaliacao,
  mapAvaliacaoPendente,
  mapearAvaliacoes,
} from "./mapeadores";

/**
 * Lista avaliações paginadas de um produto (rota pública).
 */
export async function listarAvaliacoesProduto(sku, opcoes = {}) {
  const skuNormalizado = encodeURIComponent(String(sku || "").trim());
  const params = new URLSearchParams();
  if (opcoes.pagina) params.set("pagina", String(opcoes.pagina));
  if (opcoes.limite) params.set("limite", String(opcoes.limite));
  const queryStr = params.toString();
  const caminho = queryStr
    ? `/api/produtos/${skuNormalizado}/avaliacoes?${queryStr}`
    : `/api/produtos/${skuNormalizado}/avaliacoes`;

  const resposta = await apiFetch(caminho, {
    method: "GET",
    signal: opcoes.signal,
  });
  return mapearAvaliacoes(resposta);
}

/**
 * Consulta se o usuário logado pode avaliar o produto e sua avaliação atual (rota privada).
 */
export async function buscarMinhaAvaliacao(sku, opcoes = {}) {
  const skuNormalizado = encodeURIComponent(String(sku || "").trim());
  const resposta = await apiFetch(`/api/produtos/${skuNormalizado}/avaliacoes/minha`, {
    method: "GET",
    signal: opcoes.signal,
  });
  return {
    podeAvaliar: Boolean(resposta?.podeAvaliar),
    avaliacao: resposta?.avaliacao ? mapAvaliacao(resposta.avaliacao) : null,
  };
}

/**
 * Cria ou atualiza a avaliação do usuário logado para o produto (rota privada).
 */
export async function salvarAvaliacao(sku, { nota, comentario }, opcoes = {}) {
  const skuNormalizado = encodeURIComponent(String(sku || "").trim());
  const resposta = await apiFetch(`/api/avaliacoes/${skuNormalizado}`, {
    method: "PUT",
    body: {
      nota,
      comentario: comentario ?? null,
    },
    signal: opcoes.signal,
  });
  return mapAvaliacao(resposta);
}

/**
 * Lista produtos de pedidos finalizados ainda não avaliados pelo usuário (rota privada).
 */
export async function listarAvaliacoesPendentes(opcoes = {}) {
  const resposta = await apiFetch("/api/avaliacoes/pendentes", {
    method: "GET",
    signal: opcoes.signal,
  });
  return Array.isArray(resposta)
    ? resposta.map(mapAvaliacaoPendente).filter(Boolean)
    : [];
}
