import styles from "./Login.module.css";

/**
 * Alertas de feedback da tela de Login (erro de autenticação ou sucesso de recuperação).
 */
export default function LoginFeedback({ erro = null, sucesso = null }) {
  if (erro) {
    return (
      <div className={styles.alertError} role="alert" aria-live="assertive">
        {erro}
      </div>
    );
  }

  if (sucesso) {
    return (
      <div className={styles.alertSuccess} role="status" aria-live="polite">
        {sucesso}
      </div>
    );
  }

  return null;
}
