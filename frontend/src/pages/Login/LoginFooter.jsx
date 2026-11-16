import { FOOTER_CONFIG } from "./loginConstants";
import styles from "./Login.module.css";

/**
 * Rodapé com alternância declarativa de modo (Entrar, Cadastrar, Recuperar).
 */
export default function LoginFooter({ modo, disabled, onMudarModo }) {
  const config = FOOTER_CONFIG[modo];

  if (!config) {
    return null;
  }

  return (
    <footer className={styles.formFooter}>
      <p className={styles.switchText}>
        {config.pergunta}{" "}
        <button
          type="button"
          className={styles.switchButton}
          onClick={() => onMudarModo(config.destinoModo)}
          disabled={disabled}
        >
          {config.textoBotao}
        </button>
      </p>
    </footer>
  );
}
