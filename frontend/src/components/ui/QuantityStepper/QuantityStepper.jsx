import { Minus, Plus } from "lucide-react";
import styles from "./QuantityStepper.module.css";

/**
 * QuantityStepper conforme docs/DESIGN.md:
 * Pílula com botões -/+ e valor no centro.
 * Área de toque mínima de 44 px, botões desabilitados nos limites e valor com aria-live="polite".
 */
export default function QuantityStepper({
  valor = 1,
  min = 1,
  max,
  onChange,
  disabled = false,
  className = "",
}) {
  const podeDiminuir = !disabled && valor > min;
  const podeAumentar = !disabled && (max === undefined || valor < max);

  function handleDiminuir() {
    if (podeDiminuir && onChange) {
      onChange(valor - 1);
    }
  }

  function handleAumentar() {
    if (podeAumentar && onChange) {
      onChange(valor + 1);
    }
  }

  return (
    <div
      className={`${styles.container} ${disabled ? styles.disabled : ""} ${className}`.trim()}
      role="group"
      aria-label="Seletor de quantidade"
    >
      <button
        type="button"
        className={styles.stepperButton}
        onClick={handleDiminuir}
        disabled={!podeDiminuir}
        aria-label="Diminuir quantidade"
      >
        <Minus size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>

      <span
        className={styles.value}
        aria-live="polite"
        aria-atomic="true"
      >
        {valor}
      </span>

      <button
        type="button"
        className={styles.stepperButton}
        onClick={handleAumentar}
        disabled={!podeAumentar}
        aria-label="Aumentar quantidade"
      >
        <Plus size={16} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </div>
  );
}
