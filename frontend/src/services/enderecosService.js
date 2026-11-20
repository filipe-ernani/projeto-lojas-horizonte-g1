import apiFetch from "./api";
import { mapearEndereco, mapearEnderecos } from "./mapeadores";

/**
 * Lista todos os endereços cadastrados pelo usuário autenticado (/api/enderecos).
 */
export async function listarEnderecos(opcoes = {}) {
  const resposta = await apiFetch("/api/enderecos", {
    method: "GET",
    signal: opcoes.signal,
  });
  return mapearEnderecos(resposta);
}

/**
 * Cria um novo endereço para o usuário (/api/enderecos).
 */
export async function criarEndereco(dados = {}, opcoes = {}) {
  const resposta = await apiFetch("/api/enderecos", {
    method: "POST",
    body: {
      apelido: dados.apelido || "",
      cep: dados.cep || "",
      logradouro: dados.logradouro || "",
      numero: String(dados.numero || ""),
      complemento: dados.complemento || "",
      bairro: dados.bairro || "",
      cidade: dados.cidade || "",
      uf: (dados.uf || dados.estado || "").toUpperCase(),
      padrao: Boolean(dados.padrao),
    },
    signal: opcoes.signal,
  });
  return mapearEndereco(resposta);
}

/**
 * Atualiza um endereço existente do usuário (/api/enderecos/:id).
 */
export async function editarEndereco(id, dados = {}, opcoes = {}) {
  const idNormalizado = Number(id);
  const resposta = await apiFetch(`/api/enderecos/${idNormalizado}`, {
    method: "PUT",
    body: {
      apelido: dados.apelido,
      cep: dados.cep,
      logradouro: dados.logradouro,
      numero: dados.numero !== undefined ? String(dados.numero) : undefined,
      complemento: dados.complemento,
      bairro: dados.bairro,
      cidade: dados.cidade,
      uf: (dados.uf || dados.estado || "").toUpperCase() || undefined,
      padrao: dados.padrao !== undefined ? Boolean(dados.padrao) : undefined,
    },
    signal: opcoes.signal,
  });
  return mapearEndereco(resposta);
}

/**
 * Exclui um endereço do usuário (/api/enderecos/:id).
 */
export async function excluirEndereco(id, opcoes = {}) {
  const idNormalizado = Number(id);
  await apiFetch(`/api/enderecos/${idNormalizado}`, {
    method: "DELETE",
    signal: opcoes.signal,
  });
  return true;
}

/**
 * Define um endereço como o padrão do usuário.
 */
export async function definirEnderecoPadrao(id, dadosExistentes = {}, opcoes = {}) {
  return editarEndereco(id, { ...dadosExistentes, padrao: true }, opcoes);
}
