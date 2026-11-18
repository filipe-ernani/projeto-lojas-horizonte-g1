import { useCallback, useEffect, useState } from "react";
import { avaliacoes } from "@/services/produtosService";

/**
 * Hook para consultar o resumo e lista de avaliações de um produto.
 * Retorna { dados, notaMedia, qtdAvaliacoes, carregando, erro, recarregar } preservando null/0 reais da API.
 */
export default function useAvaliacoes(id) {
  const [dados, setDados] = useState(null);
  const [notaMedia, setNotaMedia] = useState(null);
  const [qtdAvaliacoes, setQtdAvaliacoes] = useState(0);
  const [carregando, setCarregando] = useState(Boolean(id));
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  const recarregar = useCallback(() => {
    if (!id) return;
    setCarregando(true);
    setErro(null);
    setVersao((v) => v + 1);
  }, [id]);

  useEffect(() => {
    if (!id) {
      return;
    }

    const controller = new AbortController();

    avaliacoes(id, { signal: controller.signal })
      .then((resposta) => {
        setDados(resposta);
        setNotaMedia(resposta.notaMedia ?? null);
        setQtdAvaliacoes(resposta.qtdAvaliacoes ?? 0);
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
  }, [id, versao]);

  return {
    dados,
    avaliacoes: dados,
    notaMedia,
    qtdAvaliacoes,
    carregando,
    erro,
    recarregar,
  };
}
