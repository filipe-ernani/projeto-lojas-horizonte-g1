import { useCallback, useEffect, useState } from "react";

export const DURACAO_FELIZ_MS = 4000;

/**
 * Estado visual da Hori: "neutra", "pensando" ou "feliz".
 * - Requisição em andamento: pensando (tem prioridade sobre o resto).
 * - Nova resposta do assistente: feliz por 4 s e depois neutra.
 * - Cliente digitando (voltarNeutra) ou nova mensagem: o feliz acaba na hora.
 * - Erro: a requisição termina sem resposta nova, então fica neutra.
 * O timer é recriado a cada resposta e limpo ao trocar de estado e ao desmontar.
 */
export default function useHoriEstado({ enviando = false, idUltimaResposta = null } = {}) {
  const [felizId, setFelizId] = useState(null);
  const [idVisto, setIdVisto] = useState(idUltimaResposta);
  const [enviandoVisto, setEnviandoVisto] = useState(enviando);

  // Ajustes durante a renderização (sem efeito) quando as entradas mudam
  if (idUltimaResposta !== idVisto) {
    setIdVisto(idUltimaResposta);
    setFelizId(idUltimaResposta || null);
  }
  if (enviando !== enviandoVisto) {
    setEnviandoVisto(enviando);
    if (enviando) setFelizId(null);
  }

  useEffect(() => {
    if (!felizId) return undefined;
    const timer = setTimeout(() => setFelizId(null), DURACAO_FELIZ_MS);
    return () => clearTimeout(timer);
  }, [felizId]);

  const voltarNeutra = useCallback(() => setFelizId(null), []);

  const estado = enviando ? "pensando" : felizId ? "feliz" : "neutra";
  return { estado, voltarNeutra };
}
