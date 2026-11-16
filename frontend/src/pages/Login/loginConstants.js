export const MODOS = Object.freeze({
  ENTRAR: "entrar",
  CADASTRAR: "cadastrar",
  RECUPERAR: "recuperar",
});

export const EMAIL_MAX_LENGTH = 254;
export const SENHA_MIN_LENGTH = 6;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MENSAGEM_SUCESSO_RECUPERACAO =
  "Link de redefinição enviado com sucesso! Verifique a caixa de entrada e a pasta de spam do seu e-mail.";

export const CONFIG_MODOS = Object.freeze({
  [MODOS.ENTRAR]: {
    titulo: "Acesse sua conta",
    subtitulo: "Boas-vindas de volta. Digite seus dados para continuar.",
    botaoSubmit: "Entrar",
    botaoCarregando: "Entrando...",
    ariaLabelForm: "Formulário de login",
  },
  [MODOS.CADASTRAR]: {
    titulo: "Crie sua conta",
    subtitulo:
      "Preencha os campos para salvar favoritos e acompanhar seus pedidos.",
    botaoSubmit: "Criar conta",
    botaoCarregando: "Criando conta...",
    ariaLabelForm: "Formulário de cadastro",
  },
  [MODOS.RECUPERAR]: {
    titulo: "Recuperar senha",
    subtitulo:
      "Informe seu e-mail cadastrado. O Firebase enviará um link de redefinição para a sua caixa de entrada (não enviamos código por SMS ou e-mail).",
    botaoSubmit: "Enviar link de recuperação",
    botaoCarregando: "Enviando link...",
    ariaLabelForm: "Formulário de recuperação de senha",
  },
});

export const FOOTER_CONFIG = Object.freeze({
  [MODOS.ENTRAR]: {
    pergunta: "Não tem uma conta?",
    textoBotao: "Cadastre-se",
    destinoModo: MODOS.CADASTRAR,
  },
  [MODOS.CADASTRAR]: {
    pergunta: "Já tem uma conta?",
    textoBotao: "Entrar",
    destinoModo: MODOS.ENTRAR,
  },
  [MODOS.RECUPERAR]: {
    pergunta: "Lembrou da senha?",
    textoBotao: "Voltar ao login",
    destinoModo: MODOS.ENTRAR,
  },
});

/**
 * Resolve o caminho de retorno com base no state de navegação do React Router.
 */
export function obterDestinoRedirecionamento(from) {
  if (!from) {
    return "/";
  }
  if (typeof from === "string") {
    return from;
  }
  const pathname = from.pathname || "/";
  const search = from.search || "";
  const hash = from.hash || "";
  return `${pathname}${search}${hash}`;
}
