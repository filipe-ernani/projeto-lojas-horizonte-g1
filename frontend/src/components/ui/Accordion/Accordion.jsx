import { ChevronDown } from "lucide-react";
import styles from "./Accordion.module.css";

/**
 * Accordion conforme docs/DESIGN.md:
 * <details> com título 17 px semibold, divisor superior e seta à direita (ChevronDown).
 */
export default function Accordion({
  titulo,
  children,
  defaultOpen = false,
  open,
  className = "",
  ...rest
}) {
  return (
    <details
      className={`${styles.accordion} ${className}`.trim()}
      open={open}
      defaultOpen={defaultOpen}
      {...rest}
    >
      <summary className={styles.summary}>
        <span className={styles.title}>{titulo}</span>
        <ChevronDown
          size={20}
          strokeWidth={1.8}
          className={styles.chevron}
          aria-hidden="true"
        />
      </summary>
      <div className={styles.content}>{children}</div>
    </details>
  );
}
