import { UFS_SET } from "@/constants/ufs";
import { extrairDigitos } from "@/utils/mascaras";

export const LIMITES_ENDERECO = {
  apelido: 30,
  logradouro: 100,
  numero: 10,
  complemento: 60,
  bairro: 60,
  cidade: 60,
};

export function validarCampoEndereco(campo, valor) {
  const texto = String(valor || "").trim();

  switch (campo) {
    case "apelido":
      if (!texto) return "Informe um apelido (ex.: Casa, Trabalho).";
      if (texto.length > LIMITES_ENDERECO.apelido) {
        return `O apelido deve ter no máximo ${LIMITES_ENDERECO.apelido} caracteres.`;
      }
      return undefined;

    case "cep": {
      const digitos = extrairDigitos(valor);
      if (digitos.length !== 8) {
        return "Informe um CEP válido com 8 dígitos.";
      }
      return undefined;
    }

    case "logradouro":
      if (!texto) return "Informe o logradouro (rua, avenida).";
      if (texto.length > LIMITES_ENDERECO.logradouro) {
        return `O logradouro deve ter no máximo ${LIMITES_ENDERECO.logradouro} caracteres.`;
      }
      return undefined;

    case "numero": {
      if (!texto) return "Informe o número ou S/N.";
      if (texto.length > LIMITES_ENDERECO.numero) {
        return `O número deve ter no máximo ${LIMITES_ENDERECO.numero} caracteres.`;
      }
      if (!/^(\d+[A-Z]?|S\/N)$/i.test(texto)) {
        return "Número inválido. Use dígitos com letra opcional no fim (ex.: 123, 123A) ou S/N.";
      }
      return undefined;
    }

    case "complemento":
      if (texto.length > LIMITES_ENDERECO.complemento) {
        return `O complemento deve ter no máximo ${LIMITES_ENDERECO.complemento} caracteres.`;
      }
      return undefined;

    case "bairro":
      if (!texto) return "Informe o bairro.";
      if (texto.length > LIMITES_ENDERECO.bairro) {
        return `O bairro deve ter no máximo ${LIMITES_ENDERECO.bairro} caracteres.`;
      }
      return undefined;

    case "cidade":
      if (!texto) return "Informe a cidade.";
      if (texto.length > LIMITES_ENDERECO.cidade) {
        return `A cidade deve ter no máximo ${LIMITES_ENDERECO.cidade} caracteres.`;
      }
      return undefined;

    case "uf": {
      const ufUpper = texto.toUpperCase();
      if (!ufUpper || !UFS_SET.has(ufUpper)) {
        return "Selecione uma UF válida.";
      }
      return undefined;
    }

    default:
      return undefined;
  }
}

/**
 * Validação completa do formulário de endereço.
 */
export function validarEndereco(dados) {
  const erros = {};
  const campos = [
    "apelido",
    "cep",
    "logradouro",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "uf",
  ];

  for (const campo of campos) {
    const msg = validarCampoEndereco(campo, dados?.[campo]);
    if (msg) {
      erros[campo] = msg;
    }
  }

  return erros;
}

/**
 * Valida telefone do perfil: vazio é permitido; preenchido exige 10 ou 11 dígitos.
 */
export function validarTelefonePerfil(valor) {
  const texto = String(valor || "").trim();
  if (!texto) return undefined;
  const digitos = extrairDigitos(texto);
  if (digitos.length !== 10 && digitos.length !== 11) {
    return "Informe um telefone válido com DDD (10 ou 11 dígitos).";
  }
  return undefined;
}
