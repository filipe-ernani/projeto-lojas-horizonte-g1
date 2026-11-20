import apiFetch from "./api";
import { mapearPerfil } from "./mapeadores";

/**
 * Obtém os dados do perfil do usuário autenticado (/api/usuarios/perfil).
 */
export async function obterPerfil(opcoes = {}) {
  const resposta = await apiFetch("/api/usuarios/perfil", {
    method: "GET",
    signal: opcoes.signal,
  });
  return mapearPerfil(resposta);
}

/**
 * Atualiza os dados de nome e telefone do perfil (/api/usuarios/perfil).
 */
export async function atualizarPerfil(dados = {}, opcoes = {}) {
  const corpo = {};
  if (dados.nome !== undefined) {
    corpo.nome = typeof dados.nome === "string" ? dados.nome.trim() : "";
  }
  if (dados.telefone !== undefined) {
    corpo.telefone = typeof dados.telefone === "string" ? dados.telefone.trim() : "";
  }

  const resposta = await apiFetch("/api/usuarios/perfil", {
    method: "PUT",
    body: corpo,
    signal: opcoes.signal,
  });
  return mapearPerfil(resposta);
}
