import styles from "./Button.module.css";

/**
 * Botão base do design system Horizonte.
 * Variantes: primary | outline | ghost
 * Tamanhos: lg (52 px) | sm (44 px)
 */
export default function Button({
  children,
  variant = "primary",
  size = "lg",
  fullWidth = false,
  type = "button",
  disabled = false,
  className = "",
  onClick,
  ...rest
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
