import { Link } from "react-router-dom";
import { formatCurrency } from "@/utils/formatCurrency";
import ProductImage from "@/components/ui/ProductImage/ProductImage";
import RatingPill from "@/components/ui/RatingPill/RatingPill";
import Badge from "@/components/ui/Badge/Badge";
import FavoriteButton from "./FavoriteButton";
import styles from "./ProductCard.module.css";

/**
 * Card de produto conforme docs/DESIGN.md:
 * Imagem 4:5 com FavoriteButton posicionado sobre a imagem (irmão do Link).
 * Selo "Novo" opcional (Badge) no canto superior esquerdo.
 * Abaixo: linha de preço em negrito + RatingPill, nome (15 px) e categoria (muted 14 px).
 * Passa cor (primeira cor disponível) e categoria para enriquecer o placeholder do ProductImage.
 */
export default function ProductCard({
  produto,
  isFavorito = false,
  onFavoritar,
  acoes,
  seloNovo = false,
}) {
  if (!produto) {
    return null;
  }

  const { id, nome, categoria, preco, imagemUrl, notaMedia, cores } = produto;
  const precoFormatado = formatCurrency(preco);
  const corHex = cores?.[0]?.hex;

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
          {seloNovo && (
            <div className={styles.badgeWrapper}>
              <Badge variante="novo">Novo</Badge>
            </div>
          )}
          <ProductImage
            imagemUrl={imagemUrl}
            alt={nome}
            cor={corHex}
            categoria={categoria}
          />
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
