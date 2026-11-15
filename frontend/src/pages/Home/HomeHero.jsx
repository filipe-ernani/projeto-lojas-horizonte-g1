import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import styles from "./HomeHero.module.css";

/**
 * Banner principal (Hero) conforme docs/DESIGN.md:
 * Hero escuro com slogan, texto complementar e botão "Ver catálogo".
 */
export default function HomeHero() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.content}>
        <span className={styles.badge}>Coleção Atemporal</span>
        <h1 id="hero-title" className={styles.title}>
          Descubra seu estilo e elegância
        </h1>
        <p className={styles.subtitle}>
          Peças essenciais desenvolvidas com corte minimalista, tecidos
          selecionados e acabamento impecável.
        </p>

        <div className={styles.actions}>
          <Link to="/catalogo" className={styles.link}>
            <Button variant="outline" size="lg" className={styles.heroButton}>
              <span>Ver catálogo</span>
              <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
