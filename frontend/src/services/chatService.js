import apiFetch from "./api";

const CHAVE_SESSAO_CHAT = "horizonte_chat_sessao_id";
const PADRAO_SESSAO = /^[A-Za-z0-9_-]{1,64}$/;
const PADRAO_SKU = /^HZ-[A-Z]{3}-\d{3}$/;

let sessaoEmMemoria = null;

function gerarId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sessao-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * sessaoId do chat: gerado uma vez por aba e guardado em sessionStorage.
 * Sem sessionStorage (modo privado ou bloqueado), fica só em memória.
 */
export function obterSessaoChat() {
  try {
    const salvo = sessionStorage.getItem(CHAVE_SESSAO_CHAT);
    if (salvo && PADRAO_SESSAO.test(salvo)) return salvo;
    const novo = sessaoEmMemoria || gerarId();
    sessionStorage.setItem(CHAVE_SESSAO_CHAT, novo);
    sessaoEmMemoria = novo;
    return novo;
  } catch {
    sessaoEmMemoria = sessaoEmMemoria || gerarId();
    return sessaoEmMemoria;
  }
}

function salvarSessaoChat(sessaoId) {
  if (!sessaoId || !PADRAO_SESSAO.test(sessaoId)) return;
  sessaoEmMemoria = sessaoId;
  try {
    sessionStorage.setItem(CHAVE_SESSAO_CHAT, sessaoId);
  } catch {
    // sessionStorage indisponível: mantém só em memória
  }
}

/**
 * Envia uma mensagem ao assistente (POST /api/chat).
 * Devolve { resposta, sessaoId, produtos: [sku] }.
 */
export async function enviarMensagemChat({ mensagem, sku }, opcoes = {}) {
  const corpo = { mensagem, sessaoId: obterSessaoChat() };
  if (sku && PADRAO_SKU.test(sku)) {
    corpo.contexto = { sku };
  }

  const dados = await apiFetch("/api/chat", {
    method: "POST",
    body: corpo,
    signal: opcoes.signal,
  });

  if (!dados || typeof dados.resposta !== "string" || !dados.resposta.trim()) {
    const erro = new Error("Resposta inválida do assistente.");
    erro.status = 502;
    throw erro;
  }

  salvarSessaoChat(dados.sessaoId);

  return {
    resposta: dados.resposta,
    sessaoId: dados.sessaoId,
    produtos: Array.isArray(dados.produtos)
      ? dados.produtos.filter((s) => typeof s === "string" && PADRAO_SKU.test(s)).slice(0, 4)
      : [],
  };
}
