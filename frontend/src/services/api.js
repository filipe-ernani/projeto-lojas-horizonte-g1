async function obterTokenAuth() {
  try {
    const modulo = await import("../firebase.js");
    const usuario = modulo?.auth?.currentUser;
    if (usuario) {
      return await usuario.getIdToken();
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

/**
 * Obtém ou inicializa o identificador de sessão persistido em sessionStorage.
 * Tratado com try/catch para ambientes onde sessionStorage está bloqueado ou indisponível.
 */
export function obterSessaoId() {
  try {
    const CHAVE = "horizonte_sessao_id";
    let sessaoId = sessionStorage.getItem(CHAVE);
    if (!sessaoId) {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        sessaoId = crypto.randomUUID();
      } else {
        sessaoId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
          /[xy]/g,
          (c) => {
            const r = Math.trunc(Math.random() * 16);
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          },
        );
      }
      sessionStorage.setItem(CHAVE, sessaoId);
    }
    return sessaoId;
  } catch {
    return null;
  }
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
