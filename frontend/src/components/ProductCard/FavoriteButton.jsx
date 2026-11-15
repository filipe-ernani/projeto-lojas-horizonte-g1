import { Heart } from "lucide-react";
import styles from "./FavoriteButton.module.css";

/**
 * Botão de favoritos conforme docs/DESIGN.md:
 * Círculo 40 px, branco, redondo, com ícone de coração.
 * aria-pressed e aria-label acessíveis.
 */
export default function FavoriteButton({
  isFavorito = false,
  onClick,
  ariaLabel = "Adicionar aos favoritos",
  className = "",
}) {
  function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${isFavorito ? styles.active : ""} ${className}`.trim()}
      aria-pressed={isFavorito}
      aria-label={ariaLabel}
      onClick={handleClick}
    >
      <Heart
        className={styles.heartIcon}
        size={20}
        strokeWidth={1.8}
        aria-hidden="true"
      />
    </button>
  );
}
