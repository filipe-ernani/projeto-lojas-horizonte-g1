import { useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";
import { AuthContext } from "./AuthContext";

const provedorGoogle = new GoogleAuthProvider();

async function loginGoogle() {
  const credencial = await signInWithPopup(auth, provedorGoogle);
  return credencial.user;
}

async function loginEmailSenha(email, senha) {
  const credencial = await signInWithEmailAndPassword(auth, email, senha);
  return credencial.user;
}

async function cadastrar(email, senha, nome) {
  const credencial = await createUserWithEmailAndPassword(auth, email, senha);
  if (nome) {
    await updateProfile(credencial.user, { displayName: nome });
  }
  return credencial.user;
}

async function sair() {
  await signOut(auth);
}

async function recuperarSenha(email) {
  await sendPasswordResetEmail(auth, email);
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // O Firebase gerencia a sessão internamente e notifica mudanças de estado aqui.
    const cancelarInscricao = onAuthStateChanged(auth, (usuarioFirebase) => {
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
    [usuario, carregando]
  );

  return <AuthContext value={valor}>{children}</AuthContext>;
}
