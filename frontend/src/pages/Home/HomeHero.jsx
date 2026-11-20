import { Link } from "react-router-dom";
import { ArrowDown, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import styles from "./HomeHero.module.css";

export default function HomeHero() {
  function aoRolarNovidades() {
    const el = document.getElementById("novidades");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.content}>
        <span className={styles.badge}>Coleção Casual & Essenciais</span>
        <h1 id="hero-title" className={styles.title}>
          Siga o seu <span className={styles.accentText}>horizonte.</span>
        </h1>
        <p className={styles.subtitle}>
          Peças casuais, versáteis e feitas para o dia a dia.
        </p>

        <div className={styles.actions}>
          <Link to="/catalogo" className={styles.link}>
            <Button size="lg" className={styles.primaryBtn}>
              <span>Explorar catálogo</span>
              <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            onClick={aoRolarNovidades}
            className={styles.outlineBtn}
          >
            <span>Ver novidades</span>
            <ArrowDown size={18} strokeWidth={1.8} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div className={styles.artWrapper} aria-hidden="true">
        <svg
          viewBox="0 0 320 220"
          className={styles.horizonArt}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Arcos concêntricos do horizonte contidos dentro do viewBox */}
          <circle
            cx="160"
            cy="110"
            r="95"
            stroke="var(--color-line)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          <circle
            cx="160"
            cy="110"
            r="75"
            stroke="var(--color-line)"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <circle
            cx="160"
            cy="110"
            r="58"
            stroke="var(--color-accent)"
            strokeWidth="1.5"
            opacity="0.4"
          />

          {/* Semicírculo de cima com --color-accent */}
          <path
            d="M 115 105 A 45 45 0 0 1 205 105 Z"
            fill="var(--color-accent)"
          />

          {/* Semicírculo de baixo com --color-logo (com deslocamento característico da logo) */}
          <path
            d="M 125 115 A 45 45 0 0 0 215 115 Z"
            fill="var(--color-logo)"
          />

          {/* Linha sutil do horizonte */}
          <line
            x1="55"
            y1="110"
            x2="265"
            y2="110"
            stroke="var(--color-line)"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.5"
          />
        </svg>
      </div>
    </section>
  );
}
