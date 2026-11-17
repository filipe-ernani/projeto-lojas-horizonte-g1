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
          Siga o seu horizonte.
        </h1>
        <p className={styles.subtitle}>
          Nova coleção casual e essenciais pensados para o seu dia, com tecidos
          confortáveis, cortes precisos e durabilidade.
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
          viewBox="0 0 380 260"
          className={styles.horizonArt}
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Arcos concêntricos do horizonte */}
          <circle
            cx="190"
            cy="190"
            r="160"
            stroke="var(--color-line)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.6"
          />
          <circle
            cx="190"
            cy="190"
            r="120"
            stroke="var(--color-line)"
            strokeWidth="1.5"
            opacity="0.8"
          />
          <circle
            cx="190"
            cy="190"
            r="80"
            stroke="var(--color-accent)"
            strokeWidth="2"
            opacity="0.7"
          />

          {/* Semicírculo terracota do sol poente / horizonte */}
          <path
            d="M 100 190 A 90 90 0 0 1 280 190 Z"
            fill="var(--color-accent)"
            opacity="0.85"
          />

          {/* Base do horizonte */}
          <line
            x1="30"
            y1="190"
            x2="350"
            y2="190"
            stroke="var(--color-brand)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 120 196 A 70 70 0 0 0 260 196 Z"
            fill="var(--color-brand)"
            opacity="0.3"
          />
        </svg>
      </div>
    </section>
  );
}
