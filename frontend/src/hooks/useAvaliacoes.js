import { useCallback, useEffect, useState } from "react";
import { listarAvaliacoesProduto } from "@/services/avaliacoesService";

const RESUMO_VAZIO = {
  media: null,
  notaMedia: null,
  total: 0,
  distribuicao: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
};

/**
 * Hook para consultar o resumo e a lista paginada de avaliações de um produto.
 */
export default function useAvaliacoes(sku, pagina = 1, limite = 10) {
  const [skuAtual, setSkuAtual] = useState(sku);
  const [itens, setItens] = useState([]);
  const [resumo, setResumo] = useState(RESUMO_VAZIO);
  const [carregando, setCarregando] = useState(Boolean(sku));
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  if (sku !== skuAtual) {
    setSkuAtual(sku);
    setItens([]);
    setResumo(RESUMO_VAZIO);
    setErro(null);
    setCarregando(Boolean(sku));
    setCarregandoMais(false);
  }

  const recarregar = useCallback(() => {
    if (!sku) return;
    setErro(null);
    if (pagina <= 1) {
      setCarregando(true);
    } else {
      setCarregandoMais(true);
    }
    setVersao((v) => v + 1);
  }, [sku, pagina]);

  useEffect(() => {
    if (!sku) {
      return;
    }

    const controller = new AbortController();

    listarAvaliacoesProduto(sku, {
      pagina,
      limite,
      signal: controller.signal,
    })
      .then((resposta) => {
        if (controller.signal.aborted) return;

        const novosItens = Array.isArray(resposta.itens) ? resposta.itens : [];
        setResumo(resposta.resumo || RESUMO_VAZIO);
        setItens((prev) => {
          if (pagina <= 1) return novosItens;
          const ids = new Set(prev.map((i) => i.id));
          return [...prev, ...novosItens.filter((i) => !ids.has(i.id))];
        });
        setErro(null);
        setCarregando(false);
        setCarregandoMais(false);
      })
      .catch((err) => {
        if (err?.name === "AbortError" || controller.signal.aborted) {
          return;
        }
        setErro(err);
        setCarregando(false);
        setCarregandoMais(false);
      });

    return () => {
      controller.abort();
    };
  }, [sku, pagina, limite, versao]);

  return {
    itens,
    resumo,
    dados: { resumo, itens },
    avaliacoes: { resumo, itens },
    notaMedia: resumo.media ?? null,
    totalAvaliacoes: resumo.total ?? 0,
    qtdAvaliacoes: resumo.total ?? 0,
    carregando,
    carregandoMais,
    erro,
    recarregar,
  };
}
