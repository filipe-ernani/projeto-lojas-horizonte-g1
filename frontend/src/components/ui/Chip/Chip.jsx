import styles from "./Chip.module.css";

/**
 * Chip conforme docs/DESIGN.md:
 * Pílula 36 a 40 px, borda --color-line, fundo branco.
 * Selecionado: borda preta (--color-ink) e fundo --color-surface.
 * Utilizado para seleção de tamanhos e filtros ativos no catálogo.
 */
export default function Chip({
  children,
  label,
  selected = false,
  onClick,
  disabled = false,
  className = "",
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      className={`${styles.chip} ${selected ? styles.selected : ""} ${className}`.trim()}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children || label}
    </button>
  );
}
