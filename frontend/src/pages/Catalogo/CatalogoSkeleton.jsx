import styles from "./CatalogoSkeleton.module.css";

/**
 * Skeleton simples para o estado de carregando do Catálogo conforme docs/DESIGN.md:
 * Blocos cinza sem spinner.
 */
export default function CatalogoSkeleton() {
  return (
    <div
      className={styles.container}
      aria-busy="true"
      aria-label="Carregando catálogo de produtos"
    >
      <div className={styles.headerSkeleton}>
        <div className={styles.titleSkeleton} />
        <div className={styles.countSkeleton} />
      </div>

      <div className={styles.layout}>
        <div className={styles.sidebarSkeleton} />

        <div className={styles.gridArea}>
          <div className="product-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`skel-prod-${index}`} className={styles.cardSkeleton}>
                <div className={styles.imageSkeleton} />
                <div className={styles.lineSkeleton} />
                <div className={styles.lineShortSkeleton} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
