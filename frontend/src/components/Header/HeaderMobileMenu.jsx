import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import styles from "./HeaderMobileMenu.module.css";

export default function HeaderMobileMenu({
  links,
  usuario,
  carregando,
  aoClicarLink,
}) {
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
        {links.map((item) => (
          <NavLink
            key={item.para}
            to={item.para}
            onClick={(e) => {
              fecharDetails(e);
              aoClicarLink(e, item);
            }}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive && !item.ehSecao ? styles.navLinkActive : ""}`
            }
          >
            {item.rotulo}
          </NavLink>
        ))}

        {!carregando && !usuario && (
          <div className={styles.mobileAuthGroup}>
            <NavLink
              to="/login"
              onClick={fecharDetails}
              className={styles.navLink}
            >
              Entrar
            </NavLink>
            <NavLink
              to="/login?modo=cadastrar"
              onClick={fecharDetails}
              className={styles.navLink}
            >
              Cadastre-se
            </NavLink>
          </div>
        )}

        {!carregando && usuario && (
          <div className={styles.mobileAuthGroup}>
            <NavLink
              to="/favoritos"
              onClick={fecharDetails}
              className={styles.navLink}
            >
              Favoritos
            </NavLink>
            <NavLink
              to="/carrinho"
              onClick={fecharDetails}
              className={styles.navLink}
            >
              Cesta
            </NavLink>
            <NavLink
              to="/perfil"
              onClick={fecharDetails}
              className={styles.navLink}
            >
              Minha conta
            </NavLink>
          </div>
        )}
      </nav>
    </details>
  );
}
