import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import IconButton from "@/components/ui/IconButton/IconButton";
import ThemeToggle from "@/components/ui/ThemeToggle/ThemeToggle";
import Logo from "@/components/ui/Logo/Logo";
import HeaderMobileMenu from "./HeaderMobileMenu";
import styles from "./Header.module.css";

const LINKS_NAV = [
  { para: "/", rotulo: "Início" },
  { para: "/#novidades", rotulo: "Novidades", ehSecao: true },
  { para: "/catalogo?categoria=Masculino", rotulo: "Masculino" },
  { para: "/catalogo?categoria=Feminino", rotulo: "Feminino" },
];

export default function Header({ totalItensCesta }) {
  const { usuario, carregando } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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

  function aoClicarLink(evento, item) {
    if (item.ehSecao && location.pathname === "/") {
      evento.preventDefault();
      const el = document.getElementById("novidades");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }

  function renderAcoesDireita() {
    return (
      <div className={styles.actions}>
        <ThemeToggle />

        {carregando ? (
          <div className={styles.actionsLoading} aria-hidden="true" />
        ) : !usuario ? (
          <div className={styles.authLinks}>
            <Link to="/login" className={styles.btnSecondary}>
              Entrar
            </Link>
            <Link to="/login?modo=cadastrar" className={styles.btnPrimary}>
              Cadastre-se
            </Link>
          </div>
        ) : (
          <>
            <IconButton icone={Heart} rotulo="Favoritos" para="/favoritos" />
            <IconButton
              icone={ShoppingBag}
              rotulo="Cesta de compras"
              para="/carrinho"
              contador={totalItensCesta}
            />
            <IconButton icone={User} rotulo="Minha conta" para="/perfil" />
          </>
        )}
      </div>
    );
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <div className={styles.topRow}>
          <div className={styles.leftGroup}>
            <HeaderMobileMenu
              links={LINKS_NAV}
              usuario={usuario}
              carregando={carregando}
              aoClicarLink={aoClicarLink}
            />

            <Link to="/" className={styles.logoLink} aria-label="Horizonte - Início">
              <Logo className={styles.logoImg} />
            </Link>

            <nav className={styles.desktopNav} aria-label="Menu principal">
              {LINKS_NAV.map((item) => (
                <NavLink
                  key={item.para}
                  to={item.para}
                  onClick={(e) => aoClicarLink(e, item)}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive && !item.ehSecao ? styles.navLinkActive : ""}`
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
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Buscar produtos"
              aria-label="Buscar produtos"
              className={styles.searchInput}
            />
          </form>

          {renderAcoesDireita()}
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
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Buscar produtos"
            aria-label="Buscar produtos"
            className={styles.searchInput}
          />
        </form>
      </div>
    </header>
  );
}
