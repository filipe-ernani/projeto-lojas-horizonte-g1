export const CHAVE_TEMA_STORAGE = "horizonte-theme";
export const EVENTO_TEMA = "horizonte-theme-change";

export function obterTemaAtual() {
  if (typeof document !== "undefined") {
    const temaAtributo = document.documentElement.getAttribute("data-theme");
    if (temaAtributo === "dark" || temaAtributo === "light") {
      return temaAtributo;
    }
  }

  if (typeof window !== "undefined") {
    try {
      const temaSalvo = localStorage.getItem(CHAVE_TEMA_STORAGE);
      if (temaSalvo === "dark" || temaSalvo === "light") {
        return temaSalvo;
      }
    } catch {
      // Ignora erro em modo privado
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }

  return "light";
}

export function aplicarTema(novoTema) {
  const temaFinal = novoTema === "dark" ? "dark" : "light";
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", temaFinal);
  }
  try {
    localStorage.setItem(CHAVE_TEMA_STORAGE, temaFinal);
  } catch {
    // Ignora erro em modo privado
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENTO_TEMA, { detail: temaFinal }));
  }
  return temaFinal;
}
