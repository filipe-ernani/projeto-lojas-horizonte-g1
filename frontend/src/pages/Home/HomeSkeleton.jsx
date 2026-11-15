import styles from "./HomeSkeleton.module.css";

/**
 * Skeleton simples para o estado de carregando da Home conforme docs/DESIGN.md:
 * Blocos cinza no lugar do conteúdo, sem spinner.
 */
export default function HomeSkeleton() {
  return (
    <div className={styles.container} aria-busy="true" aria-label="Carregando página inicial">
      {/* Skeleton do Hero */}
      <div className={styles.heroSkeleton} />

      {/* Skeleton das Categorias */}
      <div className={styles.sectionSkeleton}>
        <div className={styles.titleSkeleton} />
        <div className={styles.categoriesTrack}>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`cat-skel-${index}`} className={styles.categoryItem}>
              <div className={styles.circleSkeleton} />
              <div className={styles.labelSkeleton} />
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton da Grade de Produtos */}
      <div className={styles.sectionSkeleton}>
        <div className={styles.titleSkeleton} />
        <div className="product-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`prod-skel-${index}`} className={styles.cardSkeleton}>
              <div className={styles.imageSkeleton} />
              <div className={styles.lineSkeleton} />
              <div className={styles.lineShortSkeleton} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
