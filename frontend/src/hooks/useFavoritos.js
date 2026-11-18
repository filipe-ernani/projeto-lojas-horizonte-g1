import { useFavoritosContext } from "@/context/FavoritosContext";

/**
 * Hook para acessar a lista de favoritos e ações de alternância do usuário autenticado.
 * Retorna { dados, favoritos, skus, total, carregando, erro, recarregar, isFavorito, alternar }.
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
    isFavorito: ctx.isFavorito,
    alternar: ctx.alternar,
    recarregar: ctx.recarregar,
  };
}
