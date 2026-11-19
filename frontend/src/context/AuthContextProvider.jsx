import { useEffect, useMemo, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, GoogleAuthProvider } from "../firebase";
import { AuthContext } from "./AuthContext";

const provedorGoogle = new GoogleAuthProvider();
provedorGoogle.setCustomParameters({ prompt: "select_account" });

const MENSAGENS_ERRO_FIREBASE = {
  "auth/invalid-email": "E-mail inválido.",
  "auth/user-disabled": "Esta conta foi desativada.",
  "auth/user-not-found": "Usuário não encontrado.",
  "auth/wrong-password": "E-mail ou senha incorretos.",
  "auth/invalid-credential": "E-mail ou senha incorretos.",
  "auth/email-already-in-use": "Este e-mail já está cadastrado.",
  "auth/weak-password": "A senha deve ter pelo menos 6 caracteres.",
  "auth/too-many-requests": "Muitas tentativas. Tente novamente em instantes.",
  "auth/network-request-failed": "Sem conexão com a internet. Tente novamente.",
  "auth/popup-closed-by-user": "Login com Google cancelado.",
  "auth/cancelled-popup-request": "Login com Google cancelado.",
  "auth/popup-blocked":
    "O navegador bloqueou a janela do Google. Libere os pop-ups.",
  "auth/operation-not-allowed": "Método de login não habilitado.",
};

function traduzirErroFirebase(erro) {
  const codigo = erro?.code;
  return (
    MENSAGENS_ERRO_FIREBASE[codigo] ||
    "Não foi possível concluir a operação. Tente novamente."
  );
}

async function executarAcaoAuth(acao) {
  try {
    return await acao();
  } catch (error_) {
    throw new Error(traduzirErroFirebase(error_), { cause: error_ });
  }
}

async function loginGoogle() {
  return executarAcaoAuth(async () => {
    const credencial = await signInWithPopup(auth, provedorGoogle);
    return credencial.user;
  });
}

async function loginEmailSenha(email, senha) {
  return executarAcaoAuth(async () => {
    const credencial = await signInWithEmailAndPassword(auth, email, senha);
    return credencial.user;
  });
}

async function cadastrar(email, senha, nome) {
  return executarAcaoAuth(async () => {
    const credencial = await createUserWithEmailAndPassword(auth, email, senha);
    if (nome) {
      await updateProfile(credencial.user, { displayName: nome });
    }
    return credencial.user;
  });
}

async function sair() {
  return executarAcaoAuth(() => signOut(auth));
}

async function recuperarSenha(email) {
  return executarAcaoAuth(() => sendPasswordResetEmail(auth, email));
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // O Firebase gerencia a sessão internamente e notifica mudanças de estado aqui.
    const cancelarInscricao = onAuthStateChanged(auth, (usuarioFirebase) => {
      if (!usuarioFirebase && import.meta.env.DEV) {
        try {
          const testToken = sessionStorage.getItem("horizonte_test_token");
          if (testToken) {
            const partes = testToken.split(":");
            const uid = partes[1] || "user-teste";
            const email = partes[2] || "user@teste.com";
            const displayName = partes[3] || "Usuário Teste";
            setUsuario({
              uid,
              email,
              displayName,
              getIdToken: async () => testToken,
            });
            setCarregando(false);
            return;
          }
        } catch {
          // Silencioso se sessionStorage bloqueado
        }
      }
      setUsuario(usuarioFirebase);
      setCarregando(false);
    });

    return cancelarInscricao;
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      carregando,
      loginGoogle,
      loginEmailSenha,
      cadastrar,
      sair,
      recuperarSenha,
    }),
    [usuario, carregando],
  );

  return <AuthContext value={valor}>{children}</AuthContext>;
}
