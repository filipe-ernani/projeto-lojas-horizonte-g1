import { useCallback, useEffect, useState } from "react";
import { listarCategorias } from "@/api/categorias";

export default function useCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(() => {
    setCarregando(true);
    setErro(null);

    listarCategorias()
      .then((resposta) => {
        const lista = Array.isArray(resposta)
          ? resposta
          : resposta?.categorias || [];
        setCategorias(lista);
      })
      .catch((err) => {
        setErro(err?.message || "Não foi possível carregar as categorias.");
      })
      .finally(() => {
        setCarregando(false);
      });
  }, []);

  useEffect(() => {
    let cancelado = false;

    listarCategorias()
      .then((resposta) => {
        if (cancelado) return;
        const lista = Array.isArray(resposta)
          ? resposta
          : resposta?.categorias || [];
        setCategorias(lista);
      })
      .catch((err) => {
        if (cancelado) return;
        setErro(err?.message || "Não foi possível carregar as categorias.");
      })
      .finally(() => {
        if (!cancelado) {
          setCarregando(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return {
    categorias,
    carregando,
    erro,
    recarregar: carregar,
  };
}
