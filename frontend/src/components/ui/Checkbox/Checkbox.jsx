import { useId } from "react";
import styles from "./Checkbox.module.css";

/**
 * Checkbox conforme docs/DESIGN.md:
 * 20 px, accent-color preto, dentro de <label> com área de toque mínima de 44 px.
 */
export default function Checkbox({
  label,
  children,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  id,
  name,
  value,
  className = "",
  ...rest
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const textoLabel = children || label;

  return (
    <label
      htmlFor={inputId}
      className={`${styles.container} ${disabled ? styles.disabled : ""} ${className}`.trim()}
    >
      <input
        type="checkbox"
        id={inputId}
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        disabled={disabled}
        className={styles.input}
        {...rest}
      />
      {textoLabel ? <span className={styles.label}>{textoLabel}</span> : null}
    </label>
  );
}
