import { createContext, useContext } from "react";

export const CarrinhoContext = createContext(null);

export function useCarrinhoContext() {
  const contexto = useContext(CarrinhoContext);
  if (!contexto) {
    throw new Error(
      "useCarrinhoContext deve ser usado dentro de um CarrinhoProvider.",
    );
  }
  return contexto;
}
