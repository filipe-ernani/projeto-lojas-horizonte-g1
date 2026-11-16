import { Link } from "react-router-dom";
import styles from "./IconButton.module.css";

/**
 * IconButton base do design system Horizonte conforme docs/DESIGN.md:
 * Círculo 44 px, ícone 22 px, fundo transparente, hover --color-surface.
 * Suporta navegação via Link quando 'para' é informado, contador com badge e estado ativo.
 */
export default function IconButton({
  icone: Icone,
  rotulo,
  onClick,
  para,
  contador,
  ativo = false,
  tamanho = 44,
  disabled = false,
  type = "button",
  className = "",
  ...rest
}) {
  if (!Icone) {
    return null;
  }

  const temContador = typeof contador === "number" && contador > 0;
  let badgeTexto = null;
  if (temContador) {
    badgeTexto = contador > 99 ? "99+" : String(contador);
  }

  const classes = [
    styles.button,
    ativo ? styles.active : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inlineStyle =
    tamanho !== 44 ? { width: tamanho, height: tamanho } : undefined;

  let ariaLabelFinal = rotulo;
  if (temContador) {
    const sufixoItem = contador === 1 ? "item" : "itens";
    ariaLabelFinal = `${rotulo} (${badgeTexto} ${sufixoItem})`;
  }

  const content = (
    <>
      <Icone
        className={styles.icon}
        size={22}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      {temContador ? (
        <span className={styles.badge} aria-hidden="true">
          {badgeTexto}
        </span>
      ) : null}
    </>
  );

  if (para && !disabled) {
    return (
      <Link
        to={para}
        className={classes}
        style={inlineStyle}
        aria-label={ariaLabelFinal}
        onClick={onClick}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      style={inlineStyle}
      disabled={disabled}
      aria-label={ariaLabelFinal}
      aria-pressed={ativo ? true : undefined}
      onClick={onClick}
      {...rest}
    >
      {content}
    </button>
  );
}
