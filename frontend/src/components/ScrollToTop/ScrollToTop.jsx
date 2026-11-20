import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const INTERVALO_TENTATIVA_MS = 100;
const TEMPO_MAXIMO_MS = 2000;

function rolarParaElemento(el, suave = true) {
  if (!el) return;
  const reduzMovimento = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  )?.matches;
  el.scrollIntoView({
    behavior: suave && !reduzMovimento ? "smooth" : "auto",
    block: "start",
  });
}

function focarTituloPrincipal() {
  const h1 = document.querySelector("main h1, h1");
  if (!h1) return false;
  if (!h1.hasAttribute("tabindex")) {
    h1.setAttribute("tabindex", "-1");
  }
  h1.focus({ preventScroll: true });
  return true;
}

/**
 * Gerencia rolagem e foco programático nas trocas de rota:
 * - POP (voltar/avançar): preserva restauração nativa do navegador.
 * - Hash (#id): rola até o elemento (com novas tentativas por até 2s se ainda estiver carregando).
 * - Mudança de pathname: rola para o topo (0, 0) e move o foco para o h1 da nova página.
 * - Mudança de ?pagina= em /catalogo: rola até o início do catálogo sem subir acima do header.
 */
export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const anteriorRef = useRef({
    pathname: location.pathname,
    search: location.search,
    inicial: true,
  });

  useEffect(() => {
    const anterior = anteriorRef.current;
    anteriorRef.current = {
      pathname: location.pathname,
      search: location.search,
      inicial: false,
    };

    if (navigationType === "POP") {
      return undefined;
    }

    const canceladores = [];

    function tentarAte(fn, aoSucesso) {
      if (fn()) {
        aoSucesso?.();
        return;
      }
      const inicio = Date.now();
      const timer = setInterval(() => {
        if (fn() || Date.now() - inicio >= TEMPO_MAXIMO_MS) {
          clearInterval(timer);
        }
      }, INTERVALO_TENTATIVA_MS);
      canceladores.push(() => clearInterval(timer));
    }

    const mudouPathname = anterior.pathname !== location.pathname;

    if (location.hash) {
      const idAlvo = decodeURIComponent(location.hash.slice(1));
      if (idAlvo) {
        tentarAte(() => {
          const el = document.getElementById(idAlvo);
          if (!el) return false;
          rolarParaElemento(el, true);
          return true;
        });
      }
      if (!anterior.inicial && mudouPathname) {
        tentarAte(focarTituloPrincipal);
      }
      return () => canceladores.forEach((c) => c());
    }

    if (mudouPathname) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      if (!anterior.inicial) {
        tentarAte(focarTituloPrincipal);
      }
      return () => canceladores.forEach((c) => c());
    }

    // Mesma rota (/catalogo): só rola ao início da lista se o parâmetro pagina mudar
    if (
      !anterior.inicial &&
      location.pathname === "/catalogo" &&
      anterior.search !== location.search
    ) {
      const pagAnterior = new URLSearchParams(anterior.search).get("pagina") || "1";
      const pagAtual = new URLSearchParams(location.search).get("pagina") || "1";
      if (pagAnterior !== pagAtual) {
        const inicioCatalogo =
          document.getElementById("catalogo-inicio") ||
          document.querySelector("main h1, h1");
        rolarParaElemento(inicioCatalogo, false);
      }
    }

    return () => canceladores.forEach((c) => c());
  }, [location.pathname, location.search, location.hash, navigationType]);

  return null;
}
