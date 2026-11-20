import { Link } from "react-router-dom";
import ProductImage from "@/components/ui/ProductImage/ProductImage";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./ChatProductCard.module.css";

/**
 * Cartão compacto de produto citado pelo assistente (nome, preço e silhueta).
 */
export default function ChatProductCard({ produto, onAbrir }) {
  if (!produto?.sku) return null;
  return (
    <Link
      to={`/produto/${encodeURIComponent(produto.sku)}`}
      className={styles.card}
      onClick={onAbrir}
    >
      <ProductImage
        produto={produto}
        alt={produto.nome}
        categoria={produto.categoria}
        className={styles.imagem}
      />
      <span className={styles.info}>
        <span className={styles.nome}>{produto.nome}</span>
        <span className={styles.preco}>{formatCurrency(produto.preco)}</span>
      </span>
    </Link>
  );
}
