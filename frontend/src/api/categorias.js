import { request } from "./client";

export function listarCategorias() {
  return request("/api/categorias");
}
