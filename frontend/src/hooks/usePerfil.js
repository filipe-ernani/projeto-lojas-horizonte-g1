import { useCallback, useEffect, useState } from "react";
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
 * Retorna { dados, perfil, carregando, erro, recarregar, salvar } com AbortController.
 */
export default function usePerfil() {
  const { usuario } = useAuth();

  const [perfil, setPerfil] = useState(PERFIL_VAZIO);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  const recarregar = useCallback(() => {
    setVersao((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!usuario) {
      return;
    }

    const controller = new AbortController();

    obterPerfil({ signal: controller.signal })
      .then((dados) => {
        setPerfil(dados);
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
  }, [usuario, versao]);

  const salvar = useCallback(
    async (dadosAtualizados) => {
      if (!usuario) {
        return { precisaLogin: true };
      }

      setCarregando(true);
      setErro(null);
      try {
        const resultado = await atualizarPerfil(dadosAtualizados);
        setPerfil(resultado);
        setCarregando(false);
        return resultado;
      } catch (err) {
        setErro(err);
        setCarregando(false);
        throw err;
      }
    },
    [usuario],
  );

  const perfilEfetivo = usuario ? perfil : PERFIL_VAZIO;

  return {
    dados: perfilEfetivo,
    perfil: perfilEfetivo,
    carregando: usuario ? carregando : false,
    erro: usuario ? erro : null,
    recarregar,
    salvar,
  };
}
