import { useEffect, useRef } from "react";
import useCarrinho from "@/hooks/useCarrinho";
import { registrarCheckoutIniciado } from "@/services/carrinhoService";

/**
 * Registra o início do checkout uma única vez por abertura da página,
 * somente com a cesta carregada e com itens. Uma falha aqui nunca bloqueia a compra.
 */
export default function useCheckoutIniciado() {
  const { cestaPronta, carregando, itens } = useCarrinho();
  const disparadoRef = useRef(false);
  const temItens = itens.length > 0;

  useEffect(() => {
    if (disparadoRef.current || !cestaPronta || carregando || !temItens) {
      return;
    }

    disparadoRef.current = true;
    registrarCheckoutIniciado().catch(() => {});
  }, [cestaPronta, carregando, temItens]);
}
