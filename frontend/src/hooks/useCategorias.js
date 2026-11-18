import { useCallback, useEffect, useState } from "react";
import { listarCategorias } from "@/services/produtosService";

/**
 * Hook para carregar a lista de categorias do catálogo.
 * Retorna { dados, carregando, erro, recarregar } com suporte a cancelamento via AbortController.
 */
export default function useCategorias() {
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

    listarCategorias({ signal: controller.signal })
      .then((resultado) => {
        setDados(resultado);
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
    categorias: dados,
    carregando,
    erro,
    recarregar,
  };
}
