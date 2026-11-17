import styles from "./Badge.module.css";

const MAPA_VARIANTES = {
  neutro: styles.neutro,
  neutral: styles.neutro,
  escuro: styles.escuro,
  dark: styles.escuro,
  ok: styles.escuro,
  perigo: styles.perigo,
  danger: styles.perigo,
  cancel: styles.perigo,
  novo: styles.novo,
  new: styles.novo,
};

/**
 * Badge conforme docs/DESIGN.md:
 * Selo pílula pequena (28 px) de texto.
 * Variantes: neutro (cinza/borda), escuro (preto/branco), perigo (borda e texto vermelho) e novo (terracota).
 */
export default function Badge({
  texto,
  children,
  variante = "neutro",
  className = "",
  ...rest
}) {
  const classeVariante = MAPA_VARIANTES[variante] || styles.neutro;

  return (
    <span
      className={`${styles.badge} ${classeVariante} ${className}`.trim()}
      {...rest}
    >
      {children || texto}
    </span>
  );
}
