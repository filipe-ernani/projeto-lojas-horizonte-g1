import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { CONFIG_MODOS } from "./loginConstants";
import styles from "./Login.module.css";

/**
 * Cabeçalho mobile e títulos da tela de login/cadastro/recuperação.
 */
export default function LoginHeader({ modo }) {
  const config = CONFIG_MODOS[modo];

  return (
    <>
      <header className={styles.formHeaderMobile}>
        <Link to="/" className={styles.mobileLogo}>
          HORIZONTE
        </Link>
        <Link to="/" className={styles.backLink} aria-label="Voltar à loja">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>Voltar ao início</span>
        </Link>
      </header>

      <div className={styles.formHeading}>
        <h1 id="titulo-tela-login" className={styles.title}>
          {config.titulo}
        </h1>
        <p className={styles.subtitle}>{config.subtitulo}</p>
      </div>
    </>
  );
}
