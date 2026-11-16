import { Eye, EyeOff } from "lucide-react";
import styles from "./Login.module.css";

/**
 * Campo de senha reutilizável com botão de alternância de visibilidade e suporte a acessibilidade.
 */
export default function LoginPasswordField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  errorId,
  disabled,
  mostrarSenha,
  onToggleMostrar,
  extraAction = null,
}) {
  const inputClass = `${styles.input} ${styles.inputWithToggle} ${
    error ? styles.inputError : ""
  }`.trim();

  const toggleLabel = mostrarSenha ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`;

  return (
    <div className={styles.fieldGroup}>
      <div className={styles.labelRow}>
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        {extraAction}
      </div>

      <div className={styles.passwordWrapper}>
        <input
          id={id}
          type={mostrarSenha ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={inputClass}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={onToggleMostrar}
          aria-label={toggleLabel}
          aria-controls={id}
          aria-expanded={mostrarSenha}
          disabled={disabled}
        >
          {mostrarSenha ? (
            <EyeOff size={20} aria-hidden="true" />
          ) : (
            <Eye size={20} aria-hidden="true" />
          )}
        </button>
      </div>

      {error && (
        <span id={errorId} className={styles.fieldError} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
