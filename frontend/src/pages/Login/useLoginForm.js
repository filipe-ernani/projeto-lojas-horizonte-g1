import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  MENSAGEM_SUCESSO_RECUPERACAO,
  MODOS,
  obterDestinoRedirecionamento,
} from "./loginConstants";
import { validarCamposAuth } from "./loginValidation";

/**
 * Hook customizado para encapsular toda a lógica de estado, validação e autenticação da tela de Login.
 * Reduz a complexidade ciclomática e cognitiva do componente de visualização.
 */
export function useLoginForm(modoInicial = MODOS.ENTRAR) {
  const { loginEmailSenha, loginGoogle, cadastrar, recuperarSenha } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  function redirecionarPosLogin() {
    const destino = obterDestinoRedirecionamento(location.state?.from);
    navigate(destino, { replace: true });
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

  async function executarAcaoAutenticacao() {
    const emailLimpo = email.trim();

    const acoes = {
      [MODOS.ENTRAR]: async () => {
        await loginEmailSenha(emailLimpo, senha);
        redirecionarPosLogin();
      },
      [MODOS.CADASTRAR]: async () => {
        const nomeLimpo = nome.trim() || undefined;
        await cadastrar(emailLimpo, senha, nomeLimpo);
        redirecionarPosLogin();
      },
      [MODOS.RECUPERAR]: async () => {
        await recuperarSenha(emailLimpo);
        if (isMountedRef.current) {
          setSucessoRecuperacao(MENSAGEM_SUCESSO_RECUPERACAO);
        }
      },
    };

    const acao = acoes[modo];
    if (acao) {
      await acao();
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
      await executarAcaoAutenticacao();
    } catch (erro) {
      if (isMountedRef.current) {
        setErroGeral(
          erro.message || "Não foi possível concluir a ação. Tente novamente.",
        );
      }
    } finally {
      if (isMountedRef.current) {
        setEnviando(false);
      }
    }
  }

  async function handleLoginGoogle() {
    setErroGeral(null);
    setSucessoRecuperacao(null);
    setEnviando(true);

    try {
      await loginGoogle();
      redirecionarPosLogin();
    } catch (erro) {
      if (isMountedRef.current) {
        setErroGeral(
          erro.message ||
            "Não foi possível entrar com o Google. Tente novamente.",
        );
      }
    } finally {
      if (isMountedRef.current) {
        setEnviando(false);
      }
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
