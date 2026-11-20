import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  cancelarPedido as cancelarPedidoApi,
  listarMeusPedidos,
} from "@/services/pedidosService";

/**
 * Hook para listar e gerenciar pedidos do usuário autenticado (/api/pedidos/meus).
 * Retorna { dados, pedidos, carregando, erro, cancelando, recarregar, cancelar, cancelarPedido } com AbortController.
 */
export default function usePedidos() {
  const { usuario } = useAuth();
  const uid = usuario?.uid ?? null;

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(Boolean(uid));
  const [cancelando, setCancelando] = useState(false);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);
  const [uidAtual, setUidAtual] = useState(uid);

  // Troca de usuário: nada do usuário anterior pode continuar na tela
  if (uid !== uidAtual) {
    setUidAtual(uid);
    setPedidos([]);
    setErro(null);
    setCancelando(false);
    setCarregando(Boolean(uid));
  }

  const recarregar = useCallback(() => {
    if (!uid) {
      return;
    }
    if (erro) {
      setCarregando(true);
    }
    setErro(null);
    setVersao((v) => v + 1);
  }, [uid, erro]);

  useEffect(() => {
    if (!uid) {
      return;
    }

    const controller = new AbortController();

    listarMeusPedidos({ signal: controller.signal })
      .then((lista) => {
        if (controller.signal.aborted) {
          return;
        }
        setPedidos(lista);
        setErro(null);
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
  }, [uid, versao]);

  const cancelar = useCallback(
    async (id) => {
      if (!usuario) {
        return { precisaLogin: true };
      }

      setCancelando(true);
      try {
        const res = await cancelarPedidoApi(id);
        recarregar();
        return res;
      } finally {
        setCancelando(false);
      }
    },
    [usuario, recarregar],
  );

  const pedidosEfetivos = usuario ? pedidos : [];

  return {
    dados: pedidosEfetivos,
    pedidos: pedidosEfetivos,
    carregando: usuario ? carregando : false,
    cancelando: usuario ? cancelando : false,
    erro: usuario ? erro : null,
    recarregar,
    cancelar,
    cancelarPedido: cancelar,
  };
}
