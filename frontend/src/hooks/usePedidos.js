import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cancelarPedido, listarMeusPedidos } from "@/services/pedidosService";

/**
 * Hook para listar e gerenciar pedidos do usuário autenticado (/api/pedidos/meus).
 * Retorna { dados, pedidos, carregando, erro, recarregar, cancelar } com AbortController.
 */
export default function usePedidos() {
  const { usuario } = useAuth();

  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [versao, setVersao] = useState(0);

  const recarregar = useCallback(() => {
    setVersao((v) => v + 1);
  }, []);

  useEffect(() => {
    if (!usuario) {
      return;
    }

    const controller = new AbortController();

    listarMeusPedidos({ signal: controller.signal })
      .then((lista) => {
        setPedidos(lista);
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
  }, [usuario, versao]);

  const cancelar = useCallback(
    async (id) => {
      if (!usuario) {
        return { precisaLogin: true };
      }

      const res = await cancelarPedido(id);
      recarregar();
      return res;
    },
    [usuario, recarregar],
  );

  const pedidosEfetivos = usuario ? pedidos : [];

  return {
    dados: pedidosEfetivos,
    pedidos: pedidosEfetivos,
    carregando: usuario ? carregando : false,
    erro: usuario ? erro : null,
    recarregar,
    cancelar,
  };
}
