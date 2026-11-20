import { useId } from "react";
import styles from "./Field.module.css";

/**
 * Campo de formulário conforme docs/DESIGN.md:
 * <label> + campo 52 px, fundo --color-field, raio 12 (--radius-md), sem borda, foco com anel preto.
 * Mostra texto de ajuda e erro (--color-danger-text), ligados por aria-describedby.
 * Versão readOnly com fundo --color-surface.
 */
export default function Field({
  label,
  id,
  type = "text",
  erro,
  ajuda,
  readOnly = false,
  disabled = false,
  className = "",
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;

  const erroId = erro ? `${inputId}-error` : null;
  const ajudaId = ajuda ? `${inputId}-help` : null;
  const describedBy = [erroId, ajudaId].filter(Boolean).join(" ") || undefined;

  const inputClasses = [
    styles.input,
    readOnly ? styles.readOnly : "",
    erro ? styles.inputError : "",
    disabled ? styles.disabled : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${styles.fieldGroup} ${className}`.trim()}>
      {label ? (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      ) : null}

      <input
        id={inputId}
        type={type}
        readOnly={readOnly}
        disabled={disabled}
        aria-invalid={Boolean(erro)}
        aria-describedby={describedBy}
        aria-readonly={readOnly || undefined}
        className={inputClasses}
        {...rest}
      />

      {erro ? (
        <span id={erroId} className={styles.errorText} role="alert">
          {erro}
        </span>
      ) : null}

      {ajuda && !erro ? (
        <span id={ajudaId} className={styles.helpText}>
          {ajuda}
        </span>
      ) : null}
    </div>
  );
}
