import { createContext, useContext } from "react";

export const FavoritosContext = createContext(null);

export function useFavoritosContext() {
  const contexto = useContext(FavoritosContext);
  if (!contexto) {
    throw new Error(
      "useFavoritosContext deve ser usado dentro de um FavoritosProvider.",
    );
  }
  return contexto;
}
