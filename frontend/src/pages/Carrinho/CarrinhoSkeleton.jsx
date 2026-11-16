import styles from "./CarrinhoSkeleton.module.css";

/**
 * Skeleton para o estado de carregando do Carrinho conforme docs/DESIGN.md:
 * Blocos cinza no lugar do conteúdo, sem spinner.
 */
export default function CarrinhoSkeleton() {
  return (
    <div
      className={styles.container}
      aria-busy="true"
      aria-label="Carregando itens da sua cesta"
    >
      <div className={styles.headerSkeleton}>
        <div className={styles.titleSkeleton} />
        <div className={styles.countSkeleton} />
      </div>

      <div className={styles.layout}>
        <div className={styles.itemsList}>
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`cart-skel-${index}`} className={styles.itemSkeleton}>
              <div className={styles.imageSkeleton} />
              <div className={styles.itemInfo}>
                <div className={styles.lineSkeleton} />
                <div className={styles.lineShortSkeleton} />
                <div className={styles.stepperSkeleton} />
              </div>
            </div>
          ))}
        </div>

        <div className={styles.summarySkeleton}>
          <div className={styles.summaryTitle} />
          <div className={styles.summaryRow} />
          <div className={styles.summaryRow} />
          <div className={styles.summaryDivider} />
          <div className={styles.summaryTotal} />
          <div className={styles.summaryButton} />
        </div>
      </div>
    </div>
  );
}
