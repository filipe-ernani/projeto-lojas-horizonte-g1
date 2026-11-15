import { Link } from "react-router-dom";
import styles from "./Login.module.css";

/**
 * Banner lateral escuro da tela de login (apenas em telas desktop >= 1024px).
 * Exibe o logotipo da marca, slogan oficial e créditos conforme docs/DESIGN.md.
 */
export default function LoginBanner() {
  return (
    <section className={styles.bannerSection} aria-hidden="true">
      <div className={styles.bannerContent}>
        <Link to="/" className={styles.bannerLogo}>
          HORIZONTE
        </Link>
        <div className={styles.bannerText}>
          <p className={styles.bannerTagline}>Coleção 2026</p>
          <h2 className={styles.bannerTitle}>
            Descubra seu estilo e elegância.
          </h2>
          <p className={styles.bannerDescription}>
            Moda minimalista, atemporal e pensada para valorizar a sua essência
            em todos os momentos.
          </p>
        </div>
        <p className={styles.bannerFooter}>© 2026 Horizonte</p>
      </div>
    </section>
  );
}
