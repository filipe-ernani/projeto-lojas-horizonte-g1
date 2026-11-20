import apiFetch from "./api";
import { mapearPedidos } from "./mapeadores";

/**
 * Lista todos os pedidos do usuário autenticado (/api/pedidos/meus).
 */
export async function listarMeusPedidos(opcoes = {}) {
  const resposta = await apiFetch("/api/pedidos/meus", {
    method: "GET",
    signal: opcoes.signal,
  });
  return mapearPedidos(resposta);
}

/**
 * Cancela um pedido finalizado do usuário (/api/pedidos/:id/cancelar).
 */
export async function cancelarPedido(id, opcoes = {}) {
  const idNormalizado = Number(id);
  const resposta = await apiFetch(`/api/pedidos/${idNormalizado}/cancelar`, {
    method: "POST",
    signal: opcoes.signal,
  });
  return resposta;
}
