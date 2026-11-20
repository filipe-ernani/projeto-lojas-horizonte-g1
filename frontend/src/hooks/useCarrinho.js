import { useCarrinhoContext } from "@/context/CarrinhoContext";

/**
 * Hook para acessar o carrinho de compras do usuário autenticado.
 * Retorna { dados, carrinho, itens, subtotal, frete, total, qtdTotal, carregando, erro, erroAcao, cestaPronta, recarregar, limparErroAcao, adicionar, alterarQuantidade, remover, limpar }.
 * Assinaturas: alterarQuantidade(produtoId, tamanho, cor, novaQuantidade) e remover(produtoId, tamanho, cor).
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
    erroAcao: ctx.erroAcao,
    cestaPronta: ctx.cestaPronta,
    adicionar: ctx.adicionar,
    alterarQuantidade: ctx.alterarQuantidade,
    remover: ctx.remover,
    limpar: ctx.limpar,
    recarregar: ctx.recarregar,
    limparErroAcao: ctx.limparErroAcao,
  };
}
