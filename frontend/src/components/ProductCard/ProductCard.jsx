import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/formatCurrency";
import ProductImage from "@/components/ui/ProductImage/ProductImage";
import RatingPill from "@/components/ui/RatingPill/RatingPill";
import FavoriteButton from "./FavoriteButton";
import styles from "./ProductCard.module.css";

/**
 * Card de produto conforme docs/DESIGN.md:
 * Imagem 4:5 com FavoriteButton no canto superior direito.
 * Abaixo: linha de preço em negrito + RatingPill, nome (15 px) e categoria (muted 14 px).
 * O link envolve o card levando a /produto/:id.
 */
export default function ProductCard({ produto }) {
  if (!produto) {
    return null;
  }

  const { id, nome, categoria, preco, imagemUrl, notaMedia } = produto;
  const precoFormatado = formatCurrency(preco);

  return (
    <article className={styles.card}>
      <Link
        to={`/produto/${id}`}
        className={styles.link}
        aria-label={`${nome}, ${categoria}, por ${precoFormatado}`}
      >
        <div className={styles.imageContainer}>
          <ProductImage imagemUrl={imagemUrl} alt={nome} />
          <div className={styles.favoriteWrapper}>
            <FavoriteButton
              ariaLabel={`Adicionar ${nome} aos favoritos`}
            />
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.priceRow}>
            <span className={styles.price}>{precoFormatado}</span>
            {notaMedia ? <RatingPill nota={notaMedia} /> : null}
          </div>

          <h3 className={styles.name}>{nome}</h3>
          <p className={styles.category}>{categoria}</p>
        </div>
      </Link>
    </article>
  );
}
