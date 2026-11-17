import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import styles from "./EditorialBanner.module.css";

export default function EditorialBanner() {
  return (
    <section className={styles.banner} aria-labelledby="editorial-heading">
      <div className={styles.content}>
        <span className={styles.tag}>Nova Coleção</span>
        <h2 id="editorial-heading" className={styles.title}>
          Minimalismo e elegância para todas as ocasiões
        </h2>
        <p className={styles.description}>
          Conheça peças versáteis que combinam entre si, desenhadas para
          acompanhar a sua rotina com caimento impecável e tecidos resistentes.
        </p>
        <Link to="/catalogo" className={styles.link}>
          <Button size="lg" className={styles.button}>
            <span>Conhecer coleção</span>
            <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
