import { auth } from "../firebase.js";

async function obterTokenAuth() {
  try {
    const usuario = auth?.currentUser;
    if (usuario) {
      return await usuario.getIdToken();
    }
    if (import.meta.env.DEV) {
      const testToken = sessionStorage.getItem("horizonte_test_token");
      if (testToken) return testToken;
    }
  } catch {
    // Silencioso se o Firebase não estiver inicializado ou usuário deslogado
  }
  return null;
}

function removerBarrasFinais(url = "") {
  if (!url || typeof url !== "string") return "";
  let limpa = url.trim();
  while (limpa.endsWith("/")) {
    limpa = limpa.slice(0, -1);
  }
  return limpa;
}

const BASE_URL = removerBarrasFinais(import.meta?.env?.VITE_API_URL || "");

const CHAVE_SESSAO = "horizonte_sessao_id";
const CHAVE_ULTIMA_ATIVIDADE = "horizonte_sessao_ultima_atividade";
// Sessão do funil: termina após 30 min sem atividade ou depois de cada compra
const INATIVIDADE_MAXIMA_MS = 30 * 60 * 1000;

let sessaoEmMemoria = null;
let ultimaAtividadeEmMemoria = 0;

function gerarUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.trunc(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function guardarSessao(sessaoId, agora) {
  sessaoEmMemoria = sessaoId;
  ultimaAtividadeEmMemoria = agora;
  try {
    sessionStorage.setItem(CHAVE_SESSAO, sessaoId);
    sessionStorage.setItem(CHAVE_ULTIMA_ATIVIDADE, String(agora));
  } catch {
    // sessionStorage bloqueado: a sessão fica só em memória nesta aba
  }
}

/**
 * Identificador da sessão do funil (cabeçalho X-Sessao-Id), um por aba.
 * Cada chamada conta como atividade. Depois de 30 min sem atividade nasce uma sessão nova.
 * Sem sessionStorage, usa uma cópia em memória para nunca mandar requisição sem sessão.
 */
export function obterSessaoId() {
  const agora = Date.now();
  let sessaoId = sessaoEmMemoria;
  let ultimaAtividade = ultimaAtividadeEmMemoria;
  try {
    sessaoId = sessionStorage.getItem(CHAVE_SESSAO) || sessaoId;
    ultimaAtividade = Number(sessionStorage.getItem(CHAVE_ULTIMA_ATIVIDADE)) || ultimaAtividade;
  } catch {
    // Mantém os valores em memória
  }

  const expirou = !ultimaAtividade || agora - ultimaAtividade > INATIVIDADE_MAXIMA_MS;
  if (!sessaoId || expirou) {
    sessaoId = gerarUuid();
  }
  guardarSessao(sessaoId, agora);
  return sessaoId;
}

/**
 * Encerra a sessão atual (por exemplo, depois de uma compra): a próxima
 * requisição já sai com um X-Sessao-Id novo e abre outra sessão no funil.
 */
export function renovarSessaoId() {
  const sessaoId = gerarUuid();
  guardarSessao(sessaoId, Date.now());
  return sessaoId;
}

function parseJsonSeguro(texto) {
  if (!texto) return null;
  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

export class NetworkError extends Error {
  constructor(
    mensagem = "Não foi possível carregar. Verifique a conexão com o servidor.",
  ) {
    super(mensagem);
    this.name = "NetworkError";
    this.isNetworkError = true;
    this.status = 0;
  }
}

export class ApiError extends Error {
  constructor(mensagem, status, dados) {
    super(mensagem);
    this.name = "ApiError";
    this.status = status;
    this.dados = dados;
    this.isUnauthorized = status === 401;
    this.sessaoExpirada = status === 401;
  }
}

/**
 * Executa uma requisição HTTP para a API usando fetch nativo.
 * Injeta Authorization: Bearer <idToken> quando houver usuário logado no Firebase.
 * Injeta X-Sessao-Id sempre com uuid mantido em sessionStorage.
 * Falhas de rede viram NetworkError distinguível; respostas !ok viram ApiError com mensagem de { erro }.
 */
export async function apiFetch(caminho, opcoes = {}) {
  const caminhoNormalizado = caminho.startsWith("/") ? caminho : `/${caminho}`;
  const url = `${BASE_URL}${caminhoNormalizado}`;

  const headers = new Headers(opcoes.headers);

  let body = opcoes.body;
  if (
    body &&
    typeof body === "object" &&
    !(body instanceof FormData) &&
    typeof body !== "string"
  ) {
    body = JSON.stringify(body);
  }

  if (
    body &&
    !(body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  // X-Sessao-Id sempre presente
  const sessaoId = obterSessaoId();
  if (sessaoId && !headers.has("X-Sessao-Id")) {
    headers.set("X-Sessao-Id", sessaoId);
  }

  // Authorization quando houver usuário autenticado no Firebase
  if (!headers.has("Authorization")) {
    const token = await obterTokenAuth();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let resposta;
  try {
    resposta = await fetch(url, {
      ...opcoes,
      body,
      headers,
    });
  } catch (error_) {
    if (error_?.name === "AbortError" || opcoes.signal?.aborted) {
      throw error_;
    }
    const erroRede = new NetworkError();
    erroRede.cause = error_;
    throw erroRede;
  }

  if (resposta.status === 204) {
    return null;
  }

  const texto = await resposta.text();
  const dados = parseJsonSeguro(texto);

  if (dados === null) {
    const mensagem = !resposta.ok
      ? `Erro ${resposta.status} ao comunicar com o servidor.`
      : "Resposta inválida do servidor (esperava JSON).";
    throw new ApiError(mensagem, resposta.status, null);
  }

  if (!resposta.ok) {
    if (resposta.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("horizonte:sessao-expirada"));
    }
    const mensagem =
      dados?.erro ||
      (resposta.status === 401
        ? "Sessão expirada. Faça login novamente."
        : `Erro ${resposta.status} ao comunicar com o servidor.`);
    throw new ApiError(mensagem, resposta.status, dados);
  }

  return dados;
}

export const request = apiFetch;
export default apiFetch;
