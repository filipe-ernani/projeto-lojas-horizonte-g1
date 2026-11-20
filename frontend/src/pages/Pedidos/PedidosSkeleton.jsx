import styles from "./PedidosSkeleton.module.css";

/**
 * Skeleton para o estado de carregando da tela de Pedidos conforme docs/DESIGN.md:
 * Blocos cinza no lugar do conteúdo, sem spinner.
 */
export default function PedidosSkeleton() {
  return (
    <div
      className={styles.container}
      aria-busy="true"
      aria-label="Carregando lista de pedidos"
    >
      <div className={styles.headerSkeleton}>
        <div className={styles.titleSkeleton} />
        <div className={styles.subtitleSkeleton} />
      </div>

      <div className={styles.cardsList}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`ped-skel-${index}`} className={styles.cardSkeleton}>
            <div className={styles.topRow}>
              <div className={styles.lineSkeleton} />
              <div className={styles.badgeSkeleton} />
            </div>
            <div className={styles.metaSkeleton} />
            <div className={styles.thumbsSkeleton} />
          </div>
        ))}
      </div>
    </div>
  );
}
