import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import IconButton from "@/components/ui/IconButton/IconButton";
import styles from "./Header.module.css";

const LINKS_NAV_CENTRAL = [
  { para: "/", rotulo: "Início" },
  { para: "/catalogo", rotulo: "Catálogo" },
];

export default function Header() {
  const { usuario, carregando } = useAuth();
  const navigate = useNavigate();
  const [termoBusca, setTermoBusca] = useState("");

  function aoBuscar(evento) {
    evento.preventDefault();
    const limpa = termoBusca.trim();
    if (limpa) {
      navigate(`/catalogo?busca=${encodeURIComponent(limpa)}`);
      return;
    }
    navigate("/catalogo");
  }

  function aoClicarLinkMobile(evento) {
    const details = evento.currentTarget.closest("details");
    if (details) {
      details.removeAttribute("open");
    }
  }

  function renderAcoesDireita() {
    if (carregando) {
      return <div className={styles.actionsLoading} aria-hidden="true" />;
    }

    if (!usuario) {
      return (
        <div className={styles.authLinks}>
          <Link to="/login" className={styles.btnSecondary}>
            Entrar
          </Link>
          <Link to="/login?modo=cadastrar" className={styles.btnPrimary}>
            Cadastre-se
          </Link>
        </div>
      );
    }

    return (
      <>
        <IconButton icone={Heart} rotulo="Favoritos" para="/favoritos" />
        <IconButton
          icone={ShoppingBag}
          rotulo="Cesta de compras"
          para="/carrinho"
        />
        <IconButton icone={User} rotulo="Minha conta" para="/perfil" />
      </>
    );
  }

  function renderLinksMobile() {
    return (
      <>
        {LINKS_NAV_CENTRAL.map((item) => (
          <NavLink
            key={item.para}
            to={item.para}
            onClick={aoClicarLinkMobile}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
            }
          >
            {item.rotulo}
          </NavLink>
        ))}

        {!carregando && !usuario && (
          <>
            <NavLink
              to="/login"
              onClick={aoClicarLinkMobile}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              Entrar
            </NavLink>
            <NavLink
              to="/login?modo=cadastrar"
              onClick={aoClicarLinkMobile}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              Cadastre-se
            </NavLink>
          </>
        )}

        {!carregando && usuario && (
          <>
            <NavLink
              to="/favoritos"
              onClick={aoClicarLinkMobile}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              Favoritos
            </NavLink>
            <NavLink
              to="/carrinho"
              onClick={aoClicarLinkMobile}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              Cesta
            </NavLink>
            <NavLink
              to="/perfil"
              onClick={aoClicarLinkMobile}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
              }
            >
              Minha conta
            </NavLink>
          </>
        )}
      </>
    );
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.topRow}>
          <div className={styles.leftGroup}>
            <details className={styles.mobileMenu}>
              <summary className={styles.menuTrigger} aria-label="Abrir menu">
                <Menu size={22} strokeWidth={1.8} />
              </summary>
              <nav className={styles.mobileNav} aria-label="Menu principal">
                {renderLinksMobile()}
              </nav>
            </details>

            <Link to="/" className={styles.logo}>
              HORIZONTE
            </Link>

            <nav className={styles.desktopNav} aria-label="Menu principal">
              {LINKS_NAV_CENTRAL.map((item) => (
                <NavLink
                  key={item.para}
                  to={item.para}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.navLinkActive : ""}`
                  }
                >
                  {item.rotulo}
                </NavLink>
              ))}
            </nav>
          </div>

          <form
            className={styles.searchDesktop}
            role="search"
            onSubmit={aoBuscar}
          >
            <Search
              size={20}
              strokeWidth={1.8}
              className={styles.searchIcon}
              aria-hidden="true"
            />
            <input
              type="search"
              value={termoBusca}
              onChange={(evento) => setTermoBusca(evento.target.value)}
              placeholder="Buscar produtos"
              aria-label="Buscar produtos"
              className={styles.searchInput}
            />
          </form>

          <div className={styles.actions}>{renderAcoesDireita()}</div>
        </div>

        <form
          className={styles.searchMobile}
          role="search"
          onSubmit={aoBuscar}
        >
          <Search
            size={20}
            strokeWidth={1.8}
            className={styles.searchIcon}
            aria-hidden="true"
          />
          <input
            type="search"
            value={termoBusca}
            onChange={(evento) => setTermoBusca(evento.target.value)}
            placeholder="Buscar produtos"
            aria-label="Buscar produtos"
            className={styles.searchInput}
          />
        </form>
      </div>
    </header>
  );
}
