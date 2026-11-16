import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/formatCurrency";
import ProductImage from "@/components/ui/ProductImage/ProductImage";
import RatingPill from "@/components/ui/RatingPill/RatingPill";
import FavoriteButton from "./FavoriteButton";
import styles from "./ProductCard.module.css";

/**
 * Card de produto conforme docs/DESIGN.md:
 * Imagem 4:5 com FavoriteButton posicionado sobre a imagem (irmão do Link).
 * Abaixo: linha de preço em negrito + RatingPill, nome (15 px) e categoria (muted 14 px).
 * Acessibilidade: FavoriteButton e ações extras ficam fora do Link para evitar aninhamento interativo.
 */
export default function ProductCard({
  produto,
  isFavorito = false,
  onFavoritar,
  acoes,
}) {
  if (!produto) {
    return null;
  }

  const { id, nome, categoria, preco, imagemUrl, notaMedia } = produto;
  const precoFormatado = formatCurrency(preco);

  function handleFavoritar(evento) {
    if (evento) {
      evento.preventDefault();
      evento.stopPropagation();
    }
    if (onFavoritar) {
      onFavoritar(produto);
    }
  }

  return (
    <article className={styles.card}>
      <Link
        to={`/produto/${id}`}
        className={styles.link}
        aria-label={`${nome}, ${categoria}, por ${precoFormatado}`}
      >
        <div className={styles.imageContainer}>
          <ProductImage imagemUrl={imagemUrl} alt={nome} />
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

      <div className={styles.favoriteWrapper}>
        <FavoriteButton
          isFavorito={isFavorito}
          onClick={handleFavoritar}
          ariaLabel={
            isFavorito
              ? `Remover ${nome} dos favoritos`
              : `Adicionar ${nome} aos favoritos`
          }
        />
      </div>

      {acoes ? <div className={styles.actions}>{acoes}</div> : null}
    </article>
  );
}
