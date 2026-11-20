import styles from "./ColorSwatch.module.css";

/**
 * ColorSwatch conforme docs/DESIGN.md:
 * Círculo clicável com a cor recebida por prop (hex dinâmico via style inline).
 * Área de toque mínima de 44 px, anel visível quando selecionado e foco visível.
 * Borda em --color-line para garantir contraste em cores muito claras.
 */
export default function ColorSwatch({
  cor,
  nome,
  selected = false,
  onClick,
  disabled = false,
  className = "",
  type = "button",
  ...rest
}) {
  const rotulo = nome ? `Cor ${nome}` : `Cor ${cor || "padrão"}`;

  return (
    <button
      type={type}
      className={`${styles.touchTarget} ${selected ? styles.selected : ""} ${className}`.trim()}
      aria-label={rotulo}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      <span
        className={styles.swatch}
        style={{ backgroundColor: cor }}
        aria-hidden="true"
      />
    </button>
  );
}
