/**
 * Validação pura dos campos do formulário de endereço.
 * Conforme docs/API.md e regras D-09/D-19.
 */
export function validarEndereco(dados) {
  const erros = {};
  const cepDigitos = (dados.cep || "").replace(/\D/g, "");
  const ufLimpa = (dados.uf || "").trim();

  if (!dados.apelido?.trim()) {
    erros.apelido = "Informe um apelido (ex: Casa, Trabalho).";
  }
  if (!cepDigitos || cepDigitos.length !== 8) {
    erros.cep = "Informe um CEP válido com 8 dígitos.";
  }
  if (!dados.logradouro?.trim()) {
    erros.logradouro = "Informe o logradouro (rua, avenida).";
  }
  if (!dados.numero?.trim()) {
    erros.numero = "Informe o número.";
  }
  if (!dados.bairro?.trim()) {
    erros.bairro = "Informe o bairro.";
  }
  if (!dados.cidade?.trim()) {
    erros.cidade = "Informe a cidade.";
  }
  if (!ufLimpa || ufLimpa.length !== 2) {
    erros.uf = "Informe a UF com 2 letras (ex: SP).";
  }

  return erros;
}
