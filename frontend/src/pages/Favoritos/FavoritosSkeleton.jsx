import styles from "./FavoritosSkeleton.module.css";

/**
 * Skeleton para o estado de carregando de Favoritos conforme docs/DESIGN.md:
 * Blocos cinza no lugar do conteúdo, sem spinner.
 */
export default function FavoritosSkeleton() {
  return (
    <div
      className={styles.container}
      aria-busy="true"
      aria-label="Carregando produtos favoritos"
    >
      <div className={styles.headerSkeleton}>
        <div className={styles.titleSkeleton} />
        <div className={styles.countSkeleton} />
      </div>

      <div className="product-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={`fav-skel-${index}`} className={styles.cardSkeleton}>
            <div className={styles.imageSkeleton} />
            <div className={styles.lineSkeleton} />
            <div className={styles.lineShortSkeleton} />
            <div className={styles.buttonSkeleton} />
          </div>
        ))}
      </div>
    </div>
  );
}
