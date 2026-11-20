import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
  CHAVE_TEMA_STORAGE,
  EVENTO_TEMA,
  aplicarTema,
  obterTemaAtual,
} from "@/utils/theme";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle({ className = "", ...rest }) {
  const [tema, setTema] = useState(obterTemaAtual);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function aoMudarSistema(evento) {
      let temSalvo = null;
      try {
        temSalvo = localStorage.getItem(CHAVE_TEMA_STORAGE);
      } catch {
        // Ignora erro em modo privado
      }
      if (!temSalvo) {
        const novo = evento.matches ? "dark" : "light";
        setTema(novo);
        document.documentElement.setAttribute("data-theme", novo);
      }
    }

    function aoMudarTema(evento) {
      if (evento.detail === "dark" || evento.detail === "light") {
        setTema(evento.detail);
      }
    }

    mediaQuery.addEventListener("change", aoMudarSistema);
    window.addEventListener(EVENTO_TEMA, aoMudarTema);
    return () => {
      mediaQuery.removeEventListener("change", aoMudarSistema);
      window.removeEventListener(EVENTO_TEMA, aoMudarTema);
    };
  }, []);

  function aoAlternar() {
    const proximoTema = tema === "dark" ? "light" : "dark";
    aplicarTema(proximoTema);
    setTema(proximoTema);
  }

  const ehEscuro = tema === "dark";
  const rotulo = ehEscuro
    ? "Alternar para tema claro"
    : "Alternar para tema escuro";

  return (
    <button
      type="button"
      onClick={aoAlternar}
      className={`${styles.toggle} ${className}`.trim()}
      aria-label="Alternar tema claro e escuro"
      aria-pressed={ehEscuro}
      title={rotulo}
      {...rest}
    >
      {ehEscuro ? (
        <Sun size={20} strokeWidth={1.8} className={styles.icon} aria-hidden="true" />
      ) : (
        <Moon size={20} strokeWidth={1.8} className={styles.icon} aria-hidden="true" />
      )}
    </button>
  );
}
