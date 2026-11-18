import { FORMAS } from "./formas";
import { tipoDaPeca } from "./tipoDaPeca";
import styles from "./ProductSilhouette.module.css";

/** Silhueta da peça tingida com a cor do produto. Retorna null se o tipo for desconhecido. */
export default function ProductSilhouette({ nome, cor = "#CFC6B8", className = "" }) {
  const tipo = tipoDaPeca(nome);
  if (!tipo || !FORMAS[tipo]) return null;
  const svg = FORMAS[tipo].replaceAll("{{COR}}", cor);
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
