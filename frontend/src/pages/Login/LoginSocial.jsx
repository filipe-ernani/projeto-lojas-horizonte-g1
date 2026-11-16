import Button from "@/components/ui/Button/Button";
import GoogleIcon from "./GoogleIcon";
import styles from "./Login.module.css";

/**
 * Seção de autenticação social com Google.
 */
export default function LoginSocial({ disabled, onLoginGoogle }) {
  return (
    <div className={styles.socialBlock}>
      <div className={styles.divider}>
        <span className={styles.dividerText}>ou</span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        fullWidth
        disabled={disabled}
        onClick={onLoginGoogle}
        className={styles.googleBtn}
      >
        <GoogleIcon className={styles.googleIcon} />
        <span>Continuar com Google</span>
      </Button>
    </div>
  );
}
