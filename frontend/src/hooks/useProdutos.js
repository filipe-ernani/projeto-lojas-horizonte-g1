import { useCallback, useEffect, useState } from "react";
import { listarProdutos } from "@/services/produtosService";

/**
 * Hook para listar produtos do catálogo com filtros, paginação e debounce de 300ms exclusivamente na busca textual.
 * Retorna { dados, total, pagina, limite, carregando, erro, recarregar } com AbortController.
 */
export default function useProdutos(filtros = {}) {
  const {
    categoria = "",
    busca = "",
    tamanho = "",
    precoMin = "",
    precoMax = "",
    pagina = 1,
    limite = 12,
    ordenar = "relevancia",
  } = filtros;

  // Estado com debounce de 300ms exclusivamente para busca textual
  const [buscaDebounced, setBuscaDebounced] = useState(busca);
  const [dados, setDados] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginaReal, setPaginaReal] = useState(pagina);
  const [limiteReal, setLimiteReal] = useState(limite);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  // Aplica debounce apenas para a busca textual
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [busca]);

  const recarregar = useCallback(() => {
    setCarregando(true);
    setErro(null);
    setVersao((v) => v + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    listarProdutos(
      {
        categoria,
        busca: buscaDebounced,
        tamanho,
        precoMin,
        precoMax,
        pagina,
        limite,
        ordenar,
      },
      { signal: controller.signal },
    )
      .then((resposta) => {
        setDados(resposta.itens);
        setTotal(resposta.total);
        setPaginaReal(resposta.pagina);
        setLimiteReal(resposta.limite);
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
  }, [
    categoria,
    buscaDebounced,
    tamanho,
    precoMin,
    precoMax,
    pagina,
    limite,
    ordenar,
    versao,
  ]);

  return {
    dados,
    produtos: dados,
    total,
    pagina: paginaReal,
    limite: limiteReal,
    carregando,
    erro,
    recarregar,
  };
}
