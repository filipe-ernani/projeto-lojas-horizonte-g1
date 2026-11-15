import { Star } from "lucide-react";
import styles from "./RatingPill.module.css";

/**
 * Pílula de avaliação conforme docs/DESIGN.md:
 * Pílula branca com borda #d9d9d9 (--color-line), estrela e nota ("4.9").
 */
export default function RatingPill({ nota, qtdAvaliacoes, className = "" }) {
  if (nota === null || nota === undefined) {
    return null;
  }

  const notaFormatada = Number(nota).toFixed(1);

  return (
    <div
      className={`${styles.pill} ${className}`.trim()}
      aria-label={
        qtdAvaliacoes
          ? `Nota ${notaFormatada} de 5 com ${qtdAvaliacoes} avaliações`
          : `Nota ${notaFormatada} de 5`
      }
    >
      <Star
        className={styles.starIcon}
        size={14}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span className={styles.nota}>{notaFormatada}</span>
      {qtdAvaliacoes ? (
        <span className={styles.qtd}>({qtdAvaliacoes})</span>
      ) : null}
    </div>
  );
}
