import { useCallback, useEffect, useRef, useState } from "react";
import { enviarMensagemChat } from "@/services/chatService";
import { obterProduto } from "@/services/produtosService";

export const LIMITE_MENSAGEM_CHAT = 500;

const MENSAGENS_ERRO = {
  429: "Muitas mensagens em pouco tempo. Aguarde um instante.",
  503: "O assistente está indisponível agora.",
  504: "O assistente demorou para responder. Tente de novo.",
  502: "O assistente não conseguiu responder agora.",
};

function traduzirErro(erro) {
  const status = Number(erro?.status);
  if (status === 400 && erro?.message) {
    return { tipo: "envio", mensagem: erro.message };
  }
  if (status === 401) {
    return { tipo: "envio", mensagem: "Sua sessão expirou. Entre de novo para continuar." };
  }
  if (status === 503) return { tipo: "indisponivel", mensagem: MENSAGENS_ERRO[503] };
  if (MENSAGENS_ERRO[status]) return { tipo: "envio", mensagem: MENSAGENS_ERRO[status] };
  if (erro?.isNetworkError) return { tipo: "indisponivel", mensagem: MENSAGENS_ERRO[503] };
  return { tipo: "envio", mensagem: MENSAGENS_ERRO[502] };
}

function novoId(prefixo) {
  return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function carregarProdutos(skus, signal) {
  if (!skus.length) return [];
  const resultados = await Promise.allSettled(skus.map((sku) => obterProduto(sku, { signal })));
  return resultados
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => r.value);
}

/**
 * Conversa com o assistente Horizonte.
 * - Histórico só em memória do componente.
 * - Envia contexto.sku quando a página atual é a de um produto.
 * - Estados: enviando, erro de envio (com reenvio da última mensagem) e indisponível (503).
 */
export default function useChat({ sku = null } = {}) {
  const [mensagens, setMensagens] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const ultimaMensagemRef = useRef(null);
  const enviandoRef = useRef(false);
  const controllerRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const executar = useCallback(
    async (texto) => {
      enviandoRef.current = true;
      setEnviando(true);
      setErro(null);
      ultimaMensagemRef.current = texto;

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const dados = await enviarMensagemChat(
          { mensagem: texto, sku },
          { signal: controller.signal },
        );
        const produtos = await carregarProdutos(dados.produtos, controller.signal);
        if (controller.signal.aborted) return;

        setMensagens((anteriores) => [
          ...anteriores,
          { id: novoId("ast"), autor: "assistente", texto: dados.resposta, produtos },
        ]);
        ultimaMensagemRef.current = null;
      } catch (falha) {
        if (falha?.name === "AbortError" || controller.signal.aborted) return;
        setErro(traduzirErro(falha));
      } finally {
        if (!controller.signal.aborted) {
          enviandoRef.current = false;
          setEnviando(false);
        }
      }
    },
    [sku],
  );

  const enviar = useCallback(
    (textoBruto) => {
      const texto = String(textoBruto || "").trim();
      if (!texto || texto.length > LIMITE_MENSAGEM_CHAT || enviandoRef.current) return false;
      setMensagens((anteriores) => [
        ...anteriores,
        { id: novoId("usr"), autor: "usuario", texto, produtos: [] },
      ]);
      executar(texto);
      return true;
    },
    [executar],
  );

  const tentarDeNovo = useCallback(() => {
    if (enviandoRef.current) return;
    if (ultimaMensagemRef.current) {
      executar(ultimaMensagemRef.current);
    } else {
      setErro(null);
    }
  }, [executar]);

  return { mensagens, enviando, erro, enviar, tentarDeNovo };
}
