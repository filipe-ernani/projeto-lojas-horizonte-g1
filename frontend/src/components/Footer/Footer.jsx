import { Link } from "react-router-dom";
import Logo from "@/components/ui/Logo/Logo";
import styles from "./Footer.module.css";

const LINKS_LEGAIS = [
  { para: "/institucional", rotulo: "Sobre a Horizonte" },
  { para: "/privacidade", rotulo: "Política de Privacidade" },
  { para: "/termos", rotulo: "Termos de Uso" },
  { para: "/cookies", rotulo: "Política de Cookies" },
];

export default function Footer() {
  const anoAtual = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.topSection}>
          <div className={styles.brandCol}>
            <Link to="/" className={styles.logoLink} aria-label="Horizonte - Início">
              <Logo className={styles.logoImg} />
            </Link>
            <p className={styles.description}>
              Moda contemporânea e essenciais pensados para o seu ritmo diário,
              combinando elegância, corte minimalista e conforto duradouro.
            </p>
          </div>

          <div className={styles.navCol}>
            <h3 className={styles.navHeading}>Institucional e Legal</h3>
            <ul className={styles.navList}>
              {LINKS_LEGAIS.map((item) => (
                <li key={item.para}>
                  <Link to={item.para} className={styles.footerLink}>
                    {item.rotulo}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={styles.bottomSection}>
          <p className={styles.copy}>
            © {anoAtual} Horizonte. Todos os direitos reservados. Projeto
            acadêmico demonstrativo.
          </p>
        </div>
      </div>
    </footer>
  );
}
