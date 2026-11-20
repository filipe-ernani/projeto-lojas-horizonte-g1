import { useCallback, useEffect, useRef, useState } from "react";
import { buscarEnderecoPorCep } from "@/services/cepService";

/**
 * Hook para consulta de CEP na ViaCEP com cancelamento automático ao desmontar.
 */
export default function useCep() {
  const [buscando, setBuscando] = useState(false);
  const [erroCep, setErroCep] = useState(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const limparErroCep = useCallback(() => {
    setErroCep(null);
  }, []);

  const buscarCep = useCallback(async (cep) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setBuscando(true);
    setErroCep(null);

    try {
      const endereco = await buscarEnderecoPorCep(cep, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return { ok: false, cancelado: true };
      }
      setBuscando(false);
      return { ok: true, dados: endereco };
    } catch (err) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        return { ok: false, cancelado: true };
      }
      const mensagem =
        err?.message ||
        "Não foi possível buscar o CEP agora. Preencha o endereço manualmente.";
      setErroCep(mensagem);
      setBuscando(false);
      return { ok: false, erro: mensagem };
    }
  }, []);

  return {
    buscando,
    erroCep,
    buscarCep,
    limparErroCep,
  };
}
