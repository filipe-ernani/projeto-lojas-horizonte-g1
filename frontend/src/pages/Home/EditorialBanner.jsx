import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import styles from "./EditorialBanner.module.css";

export default function EditorialBanner() {
  return (
    <section className={styles.banner} aria-labelledby="editorial-heading">
      <div className={styles.content}>
        <span className={styles.tag}>NOVA COLEÇÃO</span>
        <h2 id="editorial-heading" className={styles.title}>
          Do nascer ao pôr do sol.
        </h2>
        <p className={styles.description}>
          Peças que combinam entre si para acompanhar a sua rotina.
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
