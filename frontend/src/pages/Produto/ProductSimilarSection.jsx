import ProductGrid from "@/components/ProductGrid/ProductGrid";
import styles from "./Produto.module.css";

/**
 * Seção de produtos semelhantes na página de detalhes do produto.
 */
export default function ProductSimilarSection({ produtos = [] }) {
  if (!Array.isArray(produtos) || produtos.length === 0) {
    return null;
  }

  return (
    <section
      className={styles.similarSection}
      aria-labelledby="semelhantes-heading"
    >
      <div className={styles.similarHeader}>
        <h2 id="semelhantes-heading" className={styles.similarTitle}>
          Produtos semelhantes
        </h2>
      </div>

      <ProductGrid produtos={produtos} />
    </section>
  );
}
