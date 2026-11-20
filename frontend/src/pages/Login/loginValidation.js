import {
  EMAIL_MAX_LENGTH,
  EMAIL_REGEX,
  MODOS,
  SENHA_MIN_LENGTH,
} from "./loginConstants";

/**
 * Validação pura dos campos de autenticação de acordo com o modo ativo.
 * Reduz complexidade ciclomática e facilita manutenção e testes unitários.
 */
export function validarCamposAuth({ modo, email, senha, confirmacaoSenha }) {
  const erros = {};
  const emailLimpo = email?.trim() || "";

  if (!emailLimpo) {
    erros.email = "Informe seu e-mail.";
  } else if (
    emailLimpo.length > EMAIL_MAX_LENGTH ||
    !EMAIL_REGEX.test(emailLimpo)
  ) {
    erros.email = "Informe um e-mail válido.";
  }

  if (modo === MODOS.RECUPERAR) {
    return erros;
  }

  if (!senha) {
    erros.senha =
      modo === MODOS.ENTRAR ? "Informe sua senha." : "Informe uma senha.";
  } else if (modo === MODOS.CADASTRAR && senha.length < SENHA_MIN_LENGTH) {
    erros.senha = `A senha deve ter pelo menos ${SENHA_MIN_LENGTH} caracteres.`;
  }

  if (modo === MODOS.CADASTRAR) {
    if (!confirmacaoSenha) {
      erros.confirmacaoSenha = "Confirme sua senha.";
    } else if (confirmacaoSenha !== senha) {
      erros.confirmacaoSenha = "As senhas não coincidem.";
    }
  }

  return erros;
}
