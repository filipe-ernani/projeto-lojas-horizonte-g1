import styles from "./PerfilSkeleton.module.css";

/**
 * Skeleton da tela de Perfil para o estado de carregamento conforme docs/DESIGN.md:
 * Blocos cinza no lugar do conteúdo, sem spinner.
 */
export default function PerfilSkeleton() {
  return (
    <div
      className={styles.skeletonContainer}
      aria-busy="true"
      aria-label="Carregando dados do perfil"
    >
      <div className={styles.sectionSkeleton}>
        <div className={styles.titleSkeleton} />
        <div className={styles.subtitleSkeleton} />
        <div className={styles.fieldSkeleton} />
        <div className={styles.fieldSkeleton} />
        <div className={styles.fieldSkeleton} />
        <div className={styles.buttonSkeleton} />
      </div>

      <div className={styles.sectionSkeleton}>
        <div className={styles.titleSkeleton} />
        <div className={styles.subtitleSkeleton} />
        <div className={styles.cardsGrid}>
          <div className={styles.cardSkeleton} />
          <div className={styles.cardSkeleton} />
        </div>
      </div>
    </div>
  );
}
