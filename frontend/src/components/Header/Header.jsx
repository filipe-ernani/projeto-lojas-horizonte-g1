import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Search, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import useCarrinho from "@/hooks/useCarrinho";
import useFavoritos from "@/hooks/useFavoritos";
import IconButton from "@/components/ui/IconButton/IconButton";
import ThemeToggle from "@/components/ui/ThemeToggle/ThemeToggle";
import Logo from "@/components/ui/Logo/Logo";
import HeaderMobileMenu from "./HeaderMobileMenu";
import { LINKS_NAV, ehItemNavAtivo } from "./headerNavUtils";
import styles from "./Header.module.css";

export default function Header({ totalItensCesta: totalItensCestaProp }) {
  const { usuario, carregando } = useAuth();
  const { qtdTotal } = useCarrinho();
  const { total: totalFavoritos } = useFavoritos();
  const navigate = useNavigate();
  const location = useLocation();
  const [termoBusca, setTermoBusca] = useState("");

  const totalItensCesta =
    totalItensCestaProp !== undefined
      ? totalItensCestaProp
      : usuario
        ? qtdTotal
        : 0;

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
        <ThemeToggle className={styles.tabletDesktopOnly} />

        {carregando ? (
          <div
            className={`${styles.actionsLoading} ${styles.tabletDesktopOnly}`}
            aria-hidden="true"
          />
        ) : !usuario ? (
          <div className={`${styles.authLinks} ${styles.tabletDesktopOnly}`}>
            <Link to="/login" className={styles.btnSecondary}>
              Entrar
            </Link>
            <Link to="/login?modo=cadastrar" className={styles.btnPrimary}>
              Cadastre-se
            </Link>
          </div>
        ) : (
          <>
            <IconButton
              icone={Heart}
              rotulo="Favoritos"
              para="/favoritos"
              contador={usuario ? totalFavoritos : 0}
              className={styles.tabletDesktopOnly}
            />
            <IconButton
              icone={ShoppingBag}
              rotulo="Cesta de compras"
              para="/carrinho"
              contador={totalItensCesta}
              className={styles.tabletDesktopOnly}
            />
            <IconButton
              icone={User}
              rotulo="Minha conta"
              para="/perfil"
              className={styles.tabletDesktopOnly}
            />
          </>
        )}

        <IconButton
          icone={ShoppingBag}
          rotulo="Cesta de compras"
          para="/carrinho"
          contador={totalItensCesta}
          className={styles.mobileOnly}
        />
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
              aoClicarLink={aoClicarLink}
              location={location}
              totalFavoritos={usuario ? totalFavoritos : 0}
              totalItensCesta={totalItensCesta}
            />

            <Link to="/" className={styles.logoLink} aria-label="Horizonte - Início">
              <Logo className={styles.logoImg} />
            </Link>

            <nav className={styles.desktopNav} aria-label="Menu principal">
              {LINKS_NAV.map((item) => {
                const ativo = ehItemNavAtivo(item.para, location);
                return (
                  <Link
                    key={item.para}
                    to={item.para}
                    onClick={(e) => aoClicarLink(e, item)}
                    className={`${styles.navLink} ${ativo ? styles.navLinkActive : ""}`.trim()}
                    aria-current={ativo ? "page" : undefined}
                  >
                    {item.rotulo}
                  </Link>
                );
              })}
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
