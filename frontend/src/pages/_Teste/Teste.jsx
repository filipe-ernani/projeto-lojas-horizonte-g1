import Button from "@/components/ui/Button/Button";
import styles from "./Teste.module.css";

export default function Teste() {
  return (
    <main className={`container ${styles.page}`}>
      <h1>Teste de componentes — Button</h1>

      <section className={styles.section}>
        <h2>Variantes (52 px — lg)</h2>
        <div className={styles.row}>
          <Button variant="primary">Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Tamanho compacto (44 px — sm)</h2>
        <div className={styles.row}>
          <Button variant="primary" size="sm">
            Primary sm
          </Button>
          <Button variant="outline" size="sm">
            Outline sm
          </Button>
          <Button variant="ghost" size="sm">
            Ghost sm
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Estado disabled</h2>
        <div className={styles.row}>
          <Button variant="primary" disabled>
            Primary disabled
          </Button>
          <Button variant="outline" disabled>
            Outline disabled
          </Button>
          <Button variant="ghost" disabled>
            Ghost disabled
          </Button>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Prop fullWidth</h2>
        <div className={styles.stack}>
          <Button variant="primary" fullWidth>
            Adicionar à cesta
          </Button>
          <Button variant="outline" size="sm" fullWidth>
            Continuar comprando
          </Button>
        </div>
      </section>
    </main>
  );
}
