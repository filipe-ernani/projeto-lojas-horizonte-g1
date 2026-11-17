import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.css";

const CHAVE_STORAGE = "horizonte-theme";

function obterTemaAtual() {
  if (typeof document !== "undefined") {
    const temaAtributo = document.documentElement.getAttribute("data-theme");
    if (temaAtributo) {
      return temaAtributo;
    }
  }

  if (typeof window !== "undefined") {
    const temaSalvo = localStorage.getItem(CHAVE_STORAGE);
    if (temaSalvo === "dark" || temaSalvo === "light") {
      return temaSalvo;
    }
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
  }

  return "light";
}

export default function ThemeToggle({ className = "", ...rest }) {
  const [tema, setTema] = useState(obterTemaAtual);

  useEffect(() => {
    // Sincroniza com alterações do sistema quando não houver preferência salva
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function aoMudarSistema(evento) {
      const temSalvo = localStorage.getItem(CHAVE_STORAGE);
      if (!temSalvo) {
        const novo = evento.matches ? "dark" : "light";
        setTema(novo);
        document.documentElement.setAttribute("data-theme", novo);
      }
    }

    mediaQuery.addEventListener("change", aoMudarSistema);
    return () => mediaQuery.removeEventListener("change", aoMudarSistema);
  }, []);

  function aoAlternar() {
    const proximoTema = tema === "dark" ? "light" : "dark";
    setTema(proximoTema);
    document.documentElement.setAttribute("data-theme", proximoTema);
    try {
      localStorage.setItem(CHAVE_STORAGE, proximoTema);
    } catch {
      // Ignora erro em modo privado
    }
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
