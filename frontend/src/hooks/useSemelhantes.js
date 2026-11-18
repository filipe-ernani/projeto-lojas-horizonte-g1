import { useCallback, useEffect, useState } from "react";
import { semelhantes } from "@/services/produtosService";

/**
 * Hook para listar produtos semelhantes recomendados a partir do SKU.
 * Retorna { dados, carregando, erro, recarregar } com AbortController.
 */
export default function useSemelhantes(id) {
  const [dados, setDados] = useState([]);
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

    semelhantes(id, { signal: controller.signal })
      .then((itens) => {
        setDados(itens);
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
    semelhantes: dados,
    carregando,
    erro,
    recarregar,
  };
}
