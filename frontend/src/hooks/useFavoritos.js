import { useFavoritosContext } from "@/context/FavoritosContext";

/**
 * Hook para acessar a lista de favoritos e ações de alternância do usuário autenticado.
 * Retorna { dados, favoritos, skus, total, carregando, erro, erroAcao, favoritosProntos, recarregar, limparErroAcao, isFavorito, alternar }.
 */
export default function useFavoritos() {
  const ctx = useFavoritosContext();

  return {
    dados: ctx.itens,
    favoritos: ctx.itens,
    skus: ctx.skus,
    total: ctx.total,
    carregando: ctx.carregando,
    erro: ctx.erro,
    erroAcao: ctx.erroAcao,
    favoritosProntos: ctx.favoritosProntos,
    isFavorito: ctx.isFavorito,
    alternar: ctx.alternar,
    recarregar: ctx.recarregar,
    limparErroAcao: ctx.limparErroAcao,
  };
}
