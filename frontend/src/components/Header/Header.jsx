import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./Header.module.css";

const LINKS_NAV = [
  { para: "/", rotulo: "Início" },
  { para: "/catalogo", rotulo: "Catálogo" },
  { para: "/favoritos", rotulo: "Favoritos" },
];

export default function Header({ qtdFavoritos = 0, qtdCarrinho = 0 }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [termoBusca, setTermoBusca] = useState("");

  const rotaConta = usuario ? "/perfil" : "/login";
  const rotuloConta = usuario ? "Minha conta" : "Entrar";

  function aoBuscar(evento) {
    evento.preventDefault();
    const limpa = termoBusca.trim();
    if (limpa) {
      navigate(`/catalogo?busca=${encodeURIComponent(limpa)}`);
      return;
    }
    navigate("/catalogo");
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.topRow}>
          <div className={styles.leftGroup}>
            <details className={styles.mobileMenu}>
              <summary className={styles.iconButton} aria-label="Abrir menu">
                <Menu size={22} strokeWidth={1.8} />
              </summary>
              <nav className={styles.mobileNav} aria-label="Menu principal">
                {LINKS_NAV.map((item) => (
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
            </details>

            <Link to="/" className={styles.logo}>
              HORIZONTE
            </Link>

            <nav className={styles.desktopNav} aria-label="Menu principal">
              {LINKS_NAV.map((item) => (
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

          <div className={styles.actions}>
            <Link
              to="/favoritos"
              className={styles.iconButton}
              aria-label="Favoritos"
            >
              <Heart size={22} strokeWidth={1.8} />
              {qtdFavoritos > 0 && (
                <span className={styles.badge}>{qtdFavoritos}</span>
              )}
            </Link>

            <Link
              to="/carrinho"
              className={styles.iconButton}
              aria-label="Cesta de compras"
            >
              <ShoppingBag size={22} strokeWidth={1.8} />
              {qtdCarrinho > 0 && (
                <span className={styles.badge}>{qtdCarrinho}</span>
              )}
            </Link>

            <Link
              to={rotaConta}
              className={styles.iconButton}
              aria-label={rotuloConta}
            >
              <User size={22} strokeWidth={1.8} />
            </Link>
          </div>
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
