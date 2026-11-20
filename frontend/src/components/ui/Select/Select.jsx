import { useId } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./Select.module.css";

/**
 * Select nativo estilizado conforme design system do Horizonte:
 * - appearance: none + seta ChevronDown (lucide-react)
 * - Altura mínima 44px (--control-h-sm), tokens claro/escuro
 * - Suporte a label, id, erro, desabilitado e foco visível
 */
export default function Select({
  value,
  onChange,
  options = [],
  label,
  id,
  erro,
  desabilitado = false,
  disabled = false,
  className = "",
  ...rest
}) {
  const generatedId = useId();
  const selectId = id || generatedId;
  const erroId = erro ? `${selectId}-error` : undefined;
  const estaDesabilitado = Boolean(desabilitado || disabled);

  const selectClasses = [
    styles.select,
    erro ? styles.selectError : "",
    estaDesabilitado ? styles.disabled : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`${styles.group} ${className}`.trim()}>
      {label ? (
        <label htmlFor={selectId} className={styles.label}>
          {label}
        </label>
      ) : null}

      <div className={styles.wrapper}>
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={estaDesabilitado}
          aria-invalid={Boolean(erro)}
          aria-describedby={erroId}
          className={selectClasses}
          {...rest}
        >
          {options.map((opcao) => (
            <option key={opcao.value} value={opcao.value} className={styles.option}>
              {opcao.label}
            </option>
          ))}
        </select>

        <ChevronDown
          size={18}
          strokeWidth={1.8}
          className={styles.chevron}
          aria-hidden="true"
        />
      </div>

      {erro ? (
        <span id={erroId} className={styles.errorText} role="alert">
          {erro}
        </span>
      ) : null}
    </div>
  );
}
