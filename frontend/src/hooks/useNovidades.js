import { useCallback, useEffect, useState } from "react";
import { listarProdutos } from "@/services/produtosService";

/**
 * Hook para listar a vitrine de novidades (D-25: 8 SKUs representativos de categorias).
 * Retorna { dados, carregando, erro, recarregar } com AbortController.
 */
export default function useNovidades() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    setVersao((v) => v + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    listarProdutos(
      { ordenar: "novidades", limite: 8 },
      { signal: controller.signal },
    )
      .then((resposta) => {
        setDados(resposta.itens);
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
  }, [versao]);

  return {
    dados,
    novidades: dados,
    carregando,
    erro,
    recarregar,
  };
}
