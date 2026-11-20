import apiFetch, { obterSessaoId } from "./api";
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
  if (!Array.isArray(payload.itens)) {
    throw new TypeError("Informe os itens da cesta para salvar.");
  }

  const itensFormatados = payload.itens.map((item) => ({
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
 * @param {Object} dados - { enderecoId, formaPagamento: "PIX" | "CARTAO_CREDITO" | "CARTAO_DEBITO", parcelas? }
 */
export async function finalizarCarrinho(dados = {}, opcoes = {}) {
  const corpo = {
    enderecoId: Number(dados.enderecoId),
    formaPagamento: dados.formaPagamento,
  };
  if (dados.parcelas !== undefined && dados.parcelas !== null) {
    corpo.parcelas = Number(dados.parcelas);
  }

  const resposta = await apiFetch("/api/carrinho/finalizar", {
    method: "POST",
    body: corpo,
    signal: opcoes.signal,
  });

  return mapearPedido(resposta);
}

/**
 * Registra o início do checkout (/api/checkout/iniciado). Sem corpo; responde 204.
 * A rota exige X-Sessao-Id, injetado pelo apiFetch: sem sessão disponível, nada é enviado.
 */
export async function registrarCheckoutIniciado(opcoes = {}) {
  if (!obterSessaoId()) {
    return false;
  }

  await apiFetch("/api/checkout/iniciado", {
    method: "POST",
    signal: opcoes.signal,
  });
  return true;
}
