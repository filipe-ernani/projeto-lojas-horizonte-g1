import { listarCategorias as listar } from "@/services/produtosService";

export function listarCategorias(opcoes) {
  return listar(opcoes);
}

export default listarCategorias;
