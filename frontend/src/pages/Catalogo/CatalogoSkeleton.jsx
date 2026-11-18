import styles from "./CatalogoSkeleton.module.css";

/**
 * Skeleton da área de produtos do Catálogo conforme docs/DESIGN.md:
 * Blocos cinza sem spinner. Cabeçalho e filtros continuam montados na página.
 */
export default function CatalogoSkeleton() {
  return (
    <div
      className={styles.container}
      aria-busy="true"
      aria-label="Carregando catálogo de produtos"
    >
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
  );
}
