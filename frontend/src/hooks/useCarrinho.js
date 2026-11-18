import { useCarrinhoContext } from "@/context/CarrinhoContext";

/**
 * Hook para acessar o carrinho de compras do usuário autenticado.
 * Retorna { dados, carrinho, itens, subtotal, frete, total, qtdTotal, carregando, erro, recarregar, adicionar, alterarQuantidade, remover, limpar }.
 */
export default function useCarrinho() {
  const ctx = useCarrinhoContext();

  return {
    dados: ctx.itens,
    carrinho: {
      itens: ctx.itens,
      subtotal: ctx.subtotal,
      frete: ctx.frete,
      total: ctx.total,
    },
    itens: ctx.itens,
    subtotal: ctx.subtotal,
    frete: ctx.frete,
    total: ctx.total,
    qtdTotal: ctx.qtdTotal,
    carregando: ctx.carregando,
    erro: ctx.erro,
    adicionar: ctx.adicionar,
    alterarQuantidade: ctx.alterarQuantidade,
    remover: ctx.remover,
    limpar: ctx.limpar,
    recarregar: ctx.recarregar,
  };
}
