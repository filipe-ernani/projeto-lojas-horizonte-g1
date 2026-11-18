import { useCallback, useEffect, useState } from "react";
import { obterProduto } from "@/services/produtosService";

/**
 * Hook para carregar um produto específico pelo SKU.
 * Garante que respostas 404 exponham erro.status = 404 para a UI distinguir entre item inexistente e falha de rede.
 * Retorna { dados, carregando, erro, recarregar } com AbortController.
 */
export default function useProduto(id) {
  const [dados, setDados] = useState(null);
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

    obterProduto(id, { signal: controller.signal })
      .then((produto) => {
        setDados(produto);
        setCarregando(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        if (err?.status === 404) {
          err.status = 404;
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
    produto: dados,
    carregando,
    erro,
    recarregar,
  };
}
