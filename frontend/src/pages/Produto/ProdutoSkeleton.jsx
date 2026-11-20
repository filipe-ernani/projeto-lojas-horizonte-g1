import styles from "./ProdutoSkeleton.module.css";

/**
 * Skeleton da tela de Produto conforme docs/DESIGN.md:
 * Blocos cinza no lugar do conteúdo enquanto os dados carregam.
 */
export default function ProdutoSkeleton() {
  return (
    <div
      className={styles.skeletonContainer}
      aria-busy="true"
      aria-label="Carregando detalhes do produto"
    >
      <div className={styles.mainGrid}>
        <div className={styles.imageBlock} />

        <div className={styles.detailsBlock}>
          <div className={styles.categoryLine} />
          <div className={styles.titleLine} />
          <div className={styles.titleLineShort} />
          <div className={styles.ratingLine} />
          <div className={styles.priceLine} />

          <div className={styles.sectionBlock}>
            <div className={styles.labelLine} />
            <div className={styles.swatchRow}>
              <div className={styles.swatchItem} />
              <div className={styles.swatchItem} />
              <div className={styles.swatchItem} />
            </div>
          </div>

          <div className={styles.sectionBlock}>
            <div className={styles.labelLine} />
            <div className={styles.chipRow}>
              <div className={styles.chipItem} />
              <div className={styles.chipItem} />
              <div className={styles.chipItem} />
              <div className={styles.chipItem} />
            </div>
          </div>

          <div className={styles.buttonRow}>
            <div className={styles.actionBtn} />
            <div className={styles.iconBtn} />
          </div>

          <div className={styles.accordionLine} />
          <div className={styles.accordionLine} />
        </div>
      </div>
    </div>
  );
}
