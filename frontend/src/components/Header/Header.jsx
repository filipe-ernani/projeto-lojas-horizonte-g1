import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import IconButton from "@/components/ui/IconButton/IconButton";
import styles from "./Header.module.css";

const LINKS_NAV = [
  { para: "/", rotulo: "Início" },
  { para: "/catalogo", rotulo: "Catálogo" },
  { para: "/favoritos", rotulo: "Favoritos" },
];

export default function Header() {
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
              <summary className={styles.menuTrigger} aria-label="Abrir menu">
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
            <IconButton
              icone={Heart}
              rotulo="Favoritos"
              para="/favoritos"
            />

            <IconButton
              icone={ShoppingBag}
              rotulo="Cesta de compras"
              para="/carrinho"
            />

            <IconButton
              icone={User}
              rotulo={rotuloConta}
              para={rotaConta}
            />
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
