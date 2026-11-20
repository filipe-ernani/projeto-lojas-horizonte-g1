import { useCallback, useEffect, useState } from "react";
import { listarProdutos } from "@/services/produtosService";

const ATRASO_FILTRO_PRECO_MS = 300;

/**
 * Hook para listar produtos do catálogo com filtros, paginação e debounce de 300ms só nos filtros de preço.
 * Retorna { dados, produtos, total, pagina, limite, carregando, atualizando, erro, recarregar } com AbortController.
 * atualizando fica ligado desde a digitação do preço até a resposta da API.
 * Filtro inválido (400) aparece em erro, nunca como lista vazia.
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

  const [precoMinDebounced, setPrecoMinDebounced] = useState(precoMin);
  const [precoMaxDebounced, setPrecoMaxDebounced] = useState(precoMax);
  const [dados, setDados] = useState([]);
  const [total, setTotal] = useState(0);
  const [paginaReal, setPaginaReal] = useState(pagina);
  const [limiteReal, setLimiteReal] = useState(limite);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  const chaveBusca = JSON.stringify([
    categoria,
    busca,
    tamanho,
    precoMinDebounced,
    precoMaxDebounced,
    pagina,
    limite,
    ordenar,
  ]);
  const [chaveAtual, setChaveAtual] = useState(chaveBusca);

  // Nova busca: erro e dados da busca anterior não podem continuar na tela
  if (chaveBusca !== chaveAtual) {
    setChaveAtual(chaveBusca);
    setDados([]);
    setTotal(0);
    setErro(null);
    setCarregando(true);
  }

  // Aplica debounce apenas nos filtros de preço
  useEffect(() => {
    const timer = setTimeout(() => {
      setPrecoMinDebounced(precoMin);
      setPrecoMaxDebounced(precoMax);
    }, ATRASO_FILTRO_PRECO_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [precoMin, precoMax]);

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
        busca,
        tamanho,
        precoMin: precoMinDebounced,
        precoMax: precoMaxDebounced,
        pagina,
        limite,
        ordenar,
      },
      { signal: controller.signal },
    )
      .then((resposta) => {
        if (controller.signal.aborted) {
          return;
        }
        setDados(resposta.itens);
        setTotal(resposta.total);
        setPaginaReal(resposta.pagina);
        setLimiteReal(resposta.limite);
        setErro(null);
        setCarregando(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setDados([]);
        setTotal(0);
        setErro(err);
        setCarregando(false);
      });

    return () => {
      controller.abort();
    };
  }, [
    categoria,
    busca,
    tamanho,
    precoMinDebounced,
    precoMaxDebounced,
    pagina,
    limite,
    ordenar,
    versao,
  ]);

  const precoPendente =
    precoMin !== precoMinDebounced || precoMax !== precoMaxDebounced;

  return {
    dados,
    produtos: dados,
    total,
    pagina: paginaReal,
    limite: limiteReal,
    carregando,
    atualizando: carregando || precoPendente,
    erro,
    recarregar,
  };
}
