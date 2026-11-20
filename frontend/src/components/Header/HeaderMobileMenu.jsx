import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  EVENTO_TEMA,
  aplicarTema,
  obterTemaAtual,
} from "@/utils/theme";
import { ehItemNavAtivo } from "./headerNavUtils";
import styles from "./HeaderMobileMenu.module.css";

export default function HeaderMobileMenu({
  links,
  usuario,
  aoClicarLink,
  totalFavoritos = 0,
  totalItensCesta = 0,
}) {
  const location = useLocation();
  const detailsRef = useRef(null);
  const summaryRef = useRef(null);
  const [aberto, setAberto] = useState(false);
  const [tema, setTema] = useState(obterTemaAtual);

  useEffect(() => {
    function aoMudarTema(evento) {
      if (evento.detail === "dark" || evento.detail === "light") {
        setTema(evento.detail);
      }
    }
    window.addEventListener(EVENTO_TEMA, aoMudarTema);
    return () => window.removeEventListener(EVENTO_TEMA, aoMudarTema);
  }, []);

  function fecharMenu(devolverFoco = false) {
    if (detailsRef.current) {
      detailsRef.current.open = false;
    }
    setAberto(false);
    if (devolverFoco) {
      summaryRef.current?.focus();
    }
  }

  useEffect(() => {
    if (!aberto) return;

    function aoPressionarTecla(evento) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        fecharMenu(true);
      }
    }

    function aoClicarFora(evento) {
      if (detailsRef.current && !detailsRef.current.contains(evento.target)) {
        fecharMenu(false);
      }
    }

    document.addEventListener("keydown", aoPressionarTecla);
    document.addEventListener("pointerdown", aoClicarFora);
    return () => {
      document.removeEventListener("keydown", aoPressionarTecla);
      document.removeEventListener("pointerdown", aoClicarFora);
    };
  }, [aberto]);

  function alternarTema() {
    const proximo = tema === "dark" ? "light" : "dark";
    aplicarTema(proximo);
    setTema(proximo);
  }

  const ehEscuro = tema === "dark";

  return (
    <details
      ref={detailsRef}
      className={styles.mobileMenu}
      onToggle={(e) => setAberto(e.currentTarget.open)}
    >
      <summary
        ref={summaryRef}
        className={styles.menuTrigger}
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
      >
        <Menu size={22} strokeWidth={1.8} aria-hidden="true" />
      </summary>

      <nav className={styles.mobileNav} aria-label="Menu principal mobile">
        {links.map((item) => {
          const ativo = ehItemNavAtivo(item.para, location);
          return (
            <Link
              key={item.para}
              to={item.para}
              onClick={(e) => {
                fecharMenu(false);
                aoClicarLink(e, item);
              }}
              className={`${styles.navLink} ${ativo ? styles.navLinkActive : ""}`.trim()}
              aria-current={ativo ? "page" : undefined}
            >
              {item.rotulo}
            </Link>
          );
        })}

        <div className={styles.divider} role="separator" />

        <Link
          to="/favoritos"
          onClick={() => fecharMenu(false)}
          className={styles.navLink}
        >
          <span>Favoritos</span>
          <span className={styles.counter} aria-label={`${totalFavoritos} favoritos`}>
            {totalFavoritos}
          </span>
        </Link>

        <Link
          to="/carrinho"
          onClick={() => fecharMenu(false)}
          className={styles.navLink}
        >
          <span>Cesta</span>
          <span className={styles.counter} aria-label={`${totalItensCesta} itens na cesta`}>
            {totalItensCesta}
          </span>
        </Link>

        <Link
          to={usuario ? "/perfil" : "/login"}
          onClick={() => fecharMenu(false)}
          className={styles.navLink}
        >
          Minha conta
        </Link>

        <div className={styles.divider} role="separator" />

        <button
          type="button"
          role="switch"
          aria-checked={ehEscuro}
          onClick={alternarTema}
          className={styles.themeSwitchRow}
        >
          <span className={styles.themeLabel}>Tema escuro</span>
          <span
            className={`${styles.switchTrack} ${ehEscuro ? styles.switchTrackAtivo : ""}`.trim()}
            aria-hidden="true"
          >
            <span className={styles.switchThumb} />
          </span>
        </button>
      </nav>
    </details>
  );
}
