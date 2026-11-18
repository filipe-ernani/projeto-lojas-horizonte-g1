import apiFetch from "./api";
import { mapearCarrinho, mapearPedido } from "./mapeadores";

/**
 * Obtém o carrinho ativo do usuário autenticado (/api/carrinho).
 */
export async function obterCarrinho(opcoes = {}) {
  const resposta = await apiFetch("/api/carrinho", {
    method: "GET",
    signal: opcoes.signal,
  });
  return mapearCarrinho(resposta);
}

/**
 * Salva ou substitui o carrinho inteiro do usuário via PUT (/api/carrinho).
 * @param {Object} payload - { itens: [{ produtoId, tamanho, cor, quantidade }], ultimaEtapa }
 */
export async function salvarCarrinho(payload = {}, opcoes = {}) {
  const itensFormatados = (payload.itens || []).map((item) => ({
    produtoId: item.produtoId || item.sku || "",
    tamanho: item.tamanho || null,
    cor: item.cor || null,
    quantidade: Math.max(1, Number(item.quantidade) || 1),
  }));

  const resposta = await apiFetch("/api/carrinho", {
    method: "PUT",
    body: {
      itens: itensFormatados,
      ultimaEtapa: payload.ultimaEtapa || "CARRINHO",
    },
    signal: opcoes.signal,
  });

  return mapearCarrinho(resposta);
}

/**
 * Finaliza o carrinho ativo gerando um pedido (/api/carrinho/finalizar).
 * @param {Object} dados - { enderecoId, formaPagamento }
 */
export async function finalizarCarrinho(dados = {}, opcoes = {}) {
  const resposta = await apiFetch("/api/carrinho/finalizar", {
    method: "POST",
    body: {
      enderecoId: Number(dados.enderecoId),
      formaPagamento: String(dados.formaPagamento || "PIX").toUpperCase(),
    },
    signal: opcoes.signal,
  });

  return mapearPedido(resposta);
}
