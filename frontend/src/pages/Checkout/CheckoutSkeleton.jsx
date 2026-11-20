import styles from "./CheckoutSkeleton.module.css";

/**
 * Skeleton para o estado carregando do Checkout conforme docs/DESIGN.md:
 * Blocos cinza no lugar do conteúdo, sem spinner.
 */
export default function CheckoutSkeleton() {
  return (
    <div
      className={styles.container}
      aria-busy="true"
      aria-label="Carregando opções de checkout"
    >
      <div className={styles.layout}>
        <div className={styles.formsColumn}>
          {/* Seção Endereço */}
          <div className={styles.sectionSkeleton}>
            <div className={styles.titleSkeleton} />
            <div className={styles.cardSkeleton} />
            <div className={styles.cardSkeleton} />
          </div>

          {/* Seção Pagamento */}
          <div className={styles.sectionSkeleton}>
            <div className={styles.titleSkeleton} />
            <div className={styles.cardSkeleton} />
            <div className={styles.cardSkeleton} />
          </div>
        </div>

        {/* Resumo */}
        <div className={styles.summaryColumn}>
          <div className={styles.summaryCardSkeleton} />
        </div>
      </div>
    </div>
  );
}
