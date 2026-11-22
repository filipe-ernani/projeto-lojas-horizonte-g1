import { useSyncExternalStore } from "react";
import { EVENTO_TEMA, obterTemaAtual } from "@/utils/theme";
import { arquivoHori } from "./horiAssets";
import styles from "./HoriAvatar.module.css";

const CONSULTA_MOVIMENTO = "(prefers-reduced-motion: reduce)";
const CONSULTA_TEMA_SISTEMA = "(prefers-color-scheme: dark)";

// Tema atual do site: o atributo data-theme do <html> (utils/theme.js),
// atualizado pelo ThemeToggle, pelo evento do projeto ou pelo sistema.
function assinarTema(aoMudar) {
  window.addEventListener(EVENTO_TEMA, aoMudar);
  const consulta = window.matchMedia?.(CONSULTA_TEMA_SISTEMA);
  consulta?.addEventListener?.("change", aoMudar);
  const observador =
    typeof MutationObserver !== "undefined" ? new MutationObserver(aoMudar) : null;
  observador?.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => {
    window.removeEventListener(EVENTO_TEMA, aoMudar);
    consulta?.removeEventListener?.("change", aoMudar);
    observador?.disconnect();
  };
}

function assinarMovimento(aoMudar) {
  const consulta = window.matchMedia?.(CONSULTA_MOVIMENTO);
  consulta?.addEventListener?.("change", aoMudar);
  return () => consulta?.removeEventListener?.("change", aoMudar);
}

function movimentoReduzidoAtual() {
  return Boolean(window.matchMedia?.(CONSULTA_MOVIMENTO)?.matches);
}

/**
 * Avatar decorativo da Hori, recortado em círculo sobre o próprio fundo do SVG.
 * Escolhe o arquivo pelo estado, pelo tema atual e pelo prefers-reduced-motion.
 */
export default function HoriAvatar({ estado = "neutra", tamanho = 40, className = "" }) {
  const tema = useSyncExternalStore(assinarTema, obterTemaAtual, () => "light");
  const movimentoReduzido = useSyncExternalStore(
    assinarMovimento,
    movimentoReduzidoAtual,
    () => false,
  );

  return (
    <span
      className={`${styles.avatar} ${className}`.trim()}
      style={{ width: tamanho, height: tamanho }}
      aria-hidden="true"
    >
      <img
        className={styles.imagem}
        src={arquivoHori(estado, tema, movimentoReduzido)}
        alt=""
        draggable="false"
        decoding="async"
      />
    </span>
  );
}
