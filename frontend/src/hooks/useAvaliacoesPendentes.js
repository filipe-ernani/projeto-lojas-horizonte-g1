import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { listarAvaliacoesPendentes } from "@/services/avaliacoesService";

/**
 * Hook para listar produtos de pedidos finalizados ainda não avaliados pelo usuário.
 */
export default function useAvaliacoesPendentes() {
  const { usuario } = useAuth();
  const uid = usuario?.uid ?? null;

  const [uidAtual, setUidAtual] = useState(uid);
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(Boolean(uid));
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  if (uid !== uidAtual) {
    setUidAtual(uid);
    setItens([]);
    setErro(null);
    setCarregando(Boolean(uid));
  }

  const recarregar = useCallback(() => {
    if (!uid) return;
    setErro(null);
    setCarregando(true);
    setVersao((v) => v + 1);
  }, [uid]);

  useEffect(() => {
    if (!uid) {
      return;
    }

    const controller = new AbortController();

    listarAvaliacoesPendentes({ signal: controller.signal })
      .then((lista) => {
        if (controller.signal.aborted) return;
        setItens(Array.isArray(lista) ? lista : []);
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

  return {
    itens,
    carregando,
    erro,
    recarregar,
  };
}
