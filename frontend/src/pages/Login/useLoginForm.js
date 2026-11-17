import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  MENSAGEM_SUCESSO_RECUPERACAO,
  MODOS,
  obterDestinoRedirecionamento,
} from "./loginConstants";
import { validarCamposAuth } from "./loginValidation";

/**
 * Hook customizado para encapsular a lógica de estado, validação e autenticação da tela de Login.
 * - Sem isMountedRef (obsoleto no React 18).
 * - Ações por modo e redirecionamento extraídos em funções pequenas e modulares.
 * - Promessas de autenticação e navegação tratadas com await sem void.
 */
export function useLoginForm(modoInicial = MODOS.ENTRAR) {
  const { loginEmailSenha, loginGoogle, cadastrar, recuperarSenha } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Estados dos campos
  const [modo, setModo] = useState(modoInicial);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");

  // Visibilidade de senhas
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacaoSenha, setMostrarConfirmacaoSenha] = useState(false);

  // Estados de controle e feedback
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [sucessoRecuperacao, setSucessoRecuperacao] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function redirecionarPosLogin() {
    const destino = obterDestinoRedirecionamento(location.state?.from);
    await navigate(destino, { replace: true });
  }

  function mudarModo(novoModo) {
    setModo(novoModo);
    setErros({});
    setErroGeral(null);
    setSucessoRecuperacao(null);
    setSenha("");
    setConfirmacaoSenha("");
    setMostrarSenha(false);
    setMostrarConfirmacaoSenha(false);
  }

  function limparErroCampo(campo) {
    if (erros[campo]) {
      setErros((prev) => ({ ...prev, [campo]: undefined }));
    }
  }

  async function executarEntrar(emailLimpo, senhaAtual) {
    await loginEmailSenha(emailLimpo, senhaAtual);
    await redirecionarPosLogin();
  }

  async function executarCadastrar(emailLimpo, senhaAtual, nomeAtual) {
    const nomeLimpo = nomeAtual.trim() || undefined;
    await cadastrar(emailLimpo, senhaAtual, nomeLimpo);
    await redirecionarPosLogin();
  }

  async function executarRecuperar(emailLimpo) {
    await recuperarSenha(emailLimpo);
    setSucessoRecuperacao(MENSAGEM_SUCESSO_RECUPERACAO);
  }

  async function executarAcaoPorModo() {
    const emailLimpo = email.trim();
    if (modo === MODOS.ENTRAR) {
      await executarEntrar(emailLimpo, senha);
      return;
    }
    if (modo === MODOS.CADASTRAR) {
      await executarCadastrar(emailLimpo, senha, nome);
      return;
    }
    if (modo === MODOS.RECUPERAR) {
      await executarRecuperar(emailLimpo);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErroGeral(null);
    setSucessoRecuperacao(null);

    const validacaoErros = validarCamposAuth({
      modo,
      email,
      senha,
      confirmacaoSenha,
    });

    if (Object.keys(validacaoErros).length > 0) {
      setErros(validacaoErros);
      return;
    }

    setErros({});
    setEnviando(true);

    try {
      await executarAcaoPorModo();
    } catch (erro) {
      setErroGeral(
        erro?.message || "Não foi possível concluir a ação. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  async function handleLoginGoogle() {
    setErroGeral(null);
    setSucessoRecuperacao(null);
    setEnviando(true);

    try {
      await loginGoogle();
      await redirecionarPosLogin();
    } catch (erro) {
      setErroGeral(
        erro?.message || "Não foi possível entrar com o Google. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return {
    modo,
    nome,
    email,
    senha,
    confirmacaoSenha,
    mostrarSenha,
    mostrarConfirmacaoSenha,
    erros,
    erroGeral,
    sucessoRecuperacao,
    enviando,
    setNome,
    setEmail,
    setSenha,
    setConfirmacaoSenha,
    setMostrarSenha,
    setMostrarConfirmacaoSenha,
    mudarModo,
    limparErroCampo,
    handleSubmit,
    handleLoginGoogle,
  };
}
