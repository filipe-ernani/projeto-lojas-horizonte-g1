export const LINKS_NAV = [
  { para: "/", rotulo: "Início" },
  { para: "/#novidades", rotulo: "Novidades", ehSecao: true },
  { para: "/catalogo?categoria=Masculino", rotulo: "Masculino" },
  { para: "/catalogo?categoria=Feminino", rotulo: "Feminino" },
];

export function ehItemNavAtivo(itemPara, location) {
  if (!location) return false;

  if (itemPara.startsWith("/#")) {
    return location.pathname === "/" && location.hash === itemPara.slice(1);
  }

  const [caminhoItem, buscaItem] = itemPara.split("?");

  if (location.pathname !== caminhoItem) {
    return false;
  }

  // Item "Início": só em "/" puro (sem query string e sem hash)
  if (caminhoItem === "/") {
    return !location.search && !location.hash;
  }

  // Itens com query string (ex.: /catalogo?categoria=Masculino)
  if (buscaItem) {
    const paramsItem = new URLSearchParams(buscaItem);
    const paramsAtual = new URLSearchParams(location.search);
    for (const [chave, valor] of paramsItem.entries()) {
      if (paramsAtual.get(chave) !== valor) {
        return false;
      }
    }
    return true;
  }

  return !location.search;
}
