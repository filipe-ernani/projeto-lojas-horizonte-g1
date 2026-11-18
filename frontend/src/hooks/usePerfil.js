import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { atualizarPerfil, obterPerfil } from "@/services/perfilService";

const PERFIL_VAZIO = {
  nome: "",
  email: "",
  telefone: "",
  criadoEm: null,
  dataLocal: null,
};

/**
 * Hook para obter e atualizar dados do perfil do usuário autenticado (/api/usuarios/perfil).
 * Retorna { dados, perfil, carregando, salvando, erro, recarregar, salvar } com AbortController.
 * Erro ao salvar não vira erro de carga: é relançado para quem chamou salvar.
 */
export default function usePerfil() {
  const { usuario } = useAuth();
  const uid = usuario?.uid ?? null;

  const [perfil, setPerfil] = useState(PERFIL_VAZIO);
  const [carregando, setCarregando] = useState(Boolean(uid));
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [uidAtual, setUidAtual] = useState(uid);
  const uidRef = useRef(uid);

  // Troca de usuário: nada do usuário anterior pode continuar na tela
  if (uid !== uidAtual) {
    setUidAtual(uid);
    setPerfil(PERFIL_VAZIO);
    setErro(null);
    setSalvando(false);
    setCarregando(Boolean(uid));
  }

  useEffect(() => {
    uidRef.current = uid;
  }, [uid]);

  const recarregar = useCallback(() => {
    if (!uid) {
      return;
    }
    if (erro) {
      setCarregando(true);
    }
    setErro(null);
    setVersao((v) => v + 1);
  }, [uid, erro]);

  useEffect(() => {
    if (!uid) {
      return;
    }

    const controller = new AbortController();

    obterPerfil({ signal: controller.signal })
      .then((dados) => {
        if (controller.signal.aborted) {
          return;
        }
        setPerfil(dados);
        setErro(null);
        setCarregando(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setErro(err);
        setCarregando(false);
      });

    return () => {
      controller.abort();
    };
  }, [uid, versao]);

  const salvar = useCallback(
    async (dadosAtualizados) => {
      if (!uid) {
        return { precisaLogin: true };
      }

      setSalvando(true);
      try {
        const resultado = await atualizarPerfil(dadosAtualizados);
        if (uidRef.current === uid) {
          setPerfil(resultado);
        }
        return resultado;
      } finally {
        if (uidRef.current === uid) {
          setSalvando(false);
        }
      }
    },
    [uid],
  );

  const perfilEfetivo = usuario ? perfil : PERFIL_VAZIO;

  return {
    dados: perfilEfetivo,
    perfil: perfilEfetivo,
    carregando: usuario ? carregando : false,
    salvando: usuario ? salvando : false,
    erro: usuario ? erro : null,
    recarregar,
    salvar,
  };
}
