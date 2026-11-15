import { Heart } from "lucide-react";
import IconButton from "@/components/ui/IconButton/IconButton";
import styles from "./FavoriteButton.module.css";

/**
 * Botão de favoritos conforme docs/DESIGN.md:
 * Utiliza o IconButton base com fundo branco (40 px) e estado ativo (aria-pressed).
 * Posicionado como irmão do link do card para evitar aninhamento de elementos interativos.
 */
export default function FavoriteButton({
  isFavorito = false,
  onClick,
  ariaLabel = "Adicionar aos favoritos",
  className = "",
}) {
  return (
    <IconButton
      icone={Heart}
      rotulo={ariaLabel}
      ativo={isFavorito}
      tamanho={40}
      onClick={onClick}
      className={`${styles.favoriteBtn} ${className}`.trim()}
    />
  );
}
