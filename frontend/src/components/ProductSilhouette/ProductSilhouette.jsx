import { FORMAS } from "./formas";
import { tipoDaPeca } from "./tipoDaPeca";
import styles from "./ProductSilhouette.module.css";

const COR_NEUTRA = "#CFC6B8";
const COR_HEX_VALIDA = /^#[0-9a-fA-F]{6}$/;

/** Silhueta da peça tingida com a cor do produto. Retorna null se o tipo for desconhecido. */
export default function ProductSilhouette({ nome, cor = COR_NEUTRA, className = "" }) {
  const tipo = tipoDaPeca(nome);
  if (!tipo || !FORMAS[tipo]) return null;
  // Só #RRGGBB entra no SVG: nome de cor ou valor inesperado usa o neutro
  const corSegura = COR_HEX_VALIDA.test(cor) ? cor : COR_NEUTRA;
  const svg = FORMAS[tipo].replaceAll("{{COR}}", corSegura);
  return (
    <svg
      className={`${styles.silhueta} ${className}`}
      viewBox="0 0 100 125"
      role="img"
      aria-label={nome}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
