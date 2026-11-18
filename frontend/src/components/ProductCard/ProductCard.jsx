import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useFavoritos from "@/hooks/useFavoritos";
import AvisoAcao from "@/components/AvisoAcao/AvisoAcao";
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
  isFavorito: isFavoritoProp,
  onFavoritar,
  acoes,
  seloNovo = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isFavorito: isFavoritoFn,
    alternar,
    favoritosProntos,
    carregando: carregandoFavoritos,
    limparErroAcao,
  } = useFavoritos();
  const [erroFavorito, setErroFavorito] = useState("");

  if (!produto) {
    return null;
  }

  const { id, nome, categoria, preco, imagemUrl, notaMedia, cores } = produto;
  const precoFormatado = formatCurrency(preco);
  const corHex = produto.corHex || cores?.[0]?.hex;

  const itemFavorito =
    isFavoritoProp !== undefined
      ? isFavoritoProp
      : isFavoritoFn(id || produto.sku);

  async function handleFavoritar(evento) {
    if (evento) {
      evento.preventDefault();
      evento.stopPropagation();
    }
    if (onFavoritar) {
      onFavoritar(produto);
      return;
    }

    // O erro aparece no próprio card: a página pode não exibir erroAcao
    setErroFavorito("");
    try {
      const resultado = await alternar(id || produto.sku, produto);
      if (resultado?.precisaLogin) {
        navigate("/login", { state: { from: location } });
      } else if (resultado?.bloqueado) {
        limparErroAcao();
        setErroFavorito(
          "Aguarde o carregamento dos seus favoritos e tente novamente.",
        );
      }
    } catch (err) {
      limparErroAcao();
      setErroFavorito(
        err?.message || "Não foi possível atualizar seus favoritos.",
      );
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
              <Badge variante="novo">Novo · SIMULADO</Badge>
            </div>
          )}
          <ProductImage
            imagemUrl={imagemUrl}
            alt={nome}
            cor={corHex}
            categoria={categoria}
            produto={produto}
          />
        </div>

        <div className={styles.content}>
          <div className={styles.priceRow}>
            <span className={styles.price}>{precoFormatado}</span>
            {notaMedia != null ? <RatingPill nota={notaMedia} /> : null}
          </div>

          <h3 className={styles.name}>{nome}</h3>
          <p className={styles.category}>{categoria}</p>
        </div>
      </Link>

      <div className={styles.favoriteWrapper}>
        <FavoriteButton
          isFavorito={itemFavorito}
          onClick={handleFavoritar}
          disabled={carregandoFavoritos && !favoritosProntos}
          ariaLabel={
            itemFavorito
              ? `Remover ${nome} dos favoritos`
              : `Adicionar ${nome} aos favoritos`
          }
        />
      </div>

      <AvisoAcao mensagem={erroFavorito} onFechar={() => setErroFavorito("")} />

      {acoes ? <div className={styles.actions}>{acoes}</div> : null}
    </article>
  );
}
