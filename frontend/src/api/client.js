import { auth } from "../firebase";

function removerBarrasFinais(url) {
  let limpa = url || "";
  while (limpa.endsWith("/")) {
    limpa = limpa.slice(0, -1);
  }
  return limpa;
}

const BASE_URL = removerBarrasFinais(import.meta.env.VITE_API_URL);

function parseJsonSeguro(texto) {
  if (!texto) {
    return null;
  }

  try {
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/**
 * Executa uma requisição HTTP para a API usando fetch nativo.
 * Envia automaticamente o ID Token do Firebase quando há usuário autenticado
 * e extrai a mensagem do campo "erro" em respostas de falha.
 */
export async function request(caminho, opcoes = {}) {
  const caminhoNormalizado = caminho.startsWith("/") ? caminho : `/${caminho}`;
  const headers = new Headers(opcoes.headers);

  if (opcoes.body && !(opcoes.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const usuarioAtual = auth.currentUser;
  if (usuarioAtual) {
    const token = await usuarioAtual.getIdToken();
    headers.set("Authorization", `Bearer ${token}`);
  }

  const resposta = await fetch(`${BASE_URL}${caminhoNormalizado}`, {
    ...opcoes,
    headers,
  });

  if (resposta.status === 204) {
    return null;
  }

  const texto = await resposta.text();
  const dados = parseJsonSeguro(texto);

  if (!resposta.ok) {
    const mensagem = dados?.erro || `Erro ${resposta.status} ao comunicar com o servidor.`;
    const erro = new Error(mensagem);
    erro.status = resposta.status;
    throw erro;
  }

  return dados;
}
