import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { ehItemNavAtivo } from "./headerNavUtils";
import styles from "./HeaderMobileMenu.module.css";

export default function HeaderMobileMenu({
  links,
  usuario,
  carregando,
  aoClicarLink,
}) {
  const location = useLocation();

  function fecharDetails(evento) {
    const details = evento.currentTarget.closest("details");
    if (details) {
      details.removeAttribute("open");
    }
  }

  return (
    <details className={styles.mobileMenu}>
      <summary className={styles.menuTrigger} aria-label="Abrir menu">
        <Menu size={22} strokeWidth={1.8} />
      </summary>

      <nav className={styles.mobileNav} aria-label="Menu principal mobile">
        {links.map((item) => {
          const ativo = ehItemNavAtivo(item.para, location);
          return (
            <Link
              key={item.para}
              to={item.para}
              onClick={(e) => {
                fecharDetails(e);
                aoClicarLink(e, item);
              }}
              className={`${styles.navLink} ${ativo ? styles.navLinkActive : ""}`.trim()}
              aria-current={ativo ? "page" : undefined}
            >
              {item.rotulo}
            </Link>
          );
        })}

        {!carregando && !usuario && (
          <div className={styles.mobileAuthGroup}>
            <Link
              to="/login"
              onClick={fecharDetails}
              className={styles.navLink}
            >
              Entrar
            </Link>
            <Link
              to="/login?modo=cadastrar"
              onClick={fecharDetails}
              className={styles.navLink}
            >
              Cadastre-se
            </Link>
          </div>
        )}

        {!carregando && usuario && (
          <div className={styles.mobileAuthGroup}>
            <Link
              to="/favoritos"
              onClick={fecharDetails}
              className={styles.navLink}
            >
              Favoritos
            </Link>
            <Link
              to="/carrinho"
              onClick={fecharDetails}
              className={styles.navLink}
            >
              Cesta
            </Link>
            <Link
              to="/perfil"
              onClick={fecharDetails}
              className={styles.navLink}
            >
              Minha conta
            </Link>
          </div>
        )}
      </nav>
    </details>
  );
}
