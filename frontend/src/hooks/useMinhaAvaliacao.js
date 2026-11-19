import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  buscarMinhaAvaliacao,
  salvarAvaliacao as salvarAvaliacaoApi,
} from "@/services/avaliacoesService";

/**
 * Hook para consultar e salvar a avaliação do usuário logado para um produto.
 */
export default function useMinhaAvaliacao(sku) {
  const { usuario } = useAuth();
  const uid = usuario?.uid ?? null;

  const [uidAtual, setUidAtual] = useState(uid);
  const [skuAtual, setSkuAtual] = useState(sku);
  const [podeAvaliar, setPodeAvaliar] = useState(false);
  const [avaliacao, setAvaliacao] = useState(null);
  const [carregando, setCarregando] = useState(Boolean(uid && sku));
  const [erro, setErro] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState(null);
  const [versao, setVersao] = useState(0);

  if (uid !== uidAtual || sku !== skuAtual) {
    setUidAtual(uid);
    setSkuAtual(sku);
    setPodeAvaliar(false);
    setAvaliacao(null);
    setErro(null);
    setErroSalvar(null);
    setSalvando(false);
    setCarregando(Boolean(uid && sku));
  }

  const recarregar = useCallback(() => {
    if (!uid || !sku) return;
    setErro(null);
    setCarregando(true);
    setVersao((v) => v + 1);
  }, [uid, sku]);

  useEffect(() => {
    if (!uid || !sku) {
      return;
    }

    const controller = new AbortController();

    buscarMinhaAvaliacao(sku, { signal: controller.signal })
      .then((res) => {
        if (controller.signal.aborted) return;
        setPodeAvaliar(Boolean(res?.podeAvaliar));
        setAvaliacao(res?.avaliacao ?? null);
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
  }, [uid, sku, versao]);

  const salvar = useCallback(
    async ({ nota, comentario }) => {
      if (!uid || !sku) {
        return { ok: false, erro: new Error("Entre na sua conta para avaliar.") };
      }

      setSalvando(true);
      setErroSalvar(null);

      try {
        const salva = await salvarAvaliacaoApi(sku, { nota, comentario });
        setAvaliacao(salva);
        setSalvando(false);
        return { ok: true, avaliacao: salva };
      } catch (err) {
        setErroSalvar(err);
        setSalvando(false);
        return { ok: false, erro: err };
      }
    },
    [uid, sku],
  );

  return {
    podeAvaliar,
    avaliacao,
    carregando,
    erro,
    salvar,
    salvando,
    erroSalvar,
    recarregar,
  };
}
