import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import ProductImage from "@/components/ui/ProductImage/ProductImage";
import QuantityStepper from "@/components/ui/QuantityStepper/QuantityStepper";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./CartItem.module.css";

/**
 * CartItem conforme docs/DESIGN.md:
 * Miniatura 110x138 (aspecto 4:5), nome, "Tamanho: M · Cor: Preto",
 * QuantityStepper, preço e botão "Remover".
 * Acessibilidade: controles de quantidade e remoção fora do link para evitar aninhamento interativo.
 */
export default function CartItem({
  item,
  onAlterarQuantidade,
  onRemover,
}) {
  if (!item) {
    return null;
  }

  const {
    produtoId,
    nome,
    preco,
    imagemUrl,
    tamanho,
    cor,
    corHex,
    quantidade = 1,
  } = item;

  const precoFormatado = formatCurrency(preco);
  const atributos = [
    tamanho ? `Tamanho: ${tamanho}` : null,
    cor ? `Cor: ${cor}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  function handleQuantidadeChange(novaQuantidade) {
    if (onAlterarQuantidade) {
      onAlterarQuantidade(item, novaQuantidade);
    }
  }

  function handleRemover() {
    if (onRemover) {
      onRemover(item);
    }
  }

  return (
    <article className={styles.item}>
      <Link
        to={`/produto/${produtoId}`}
        className={styles.imageLink}
        aria-label={`Ver detalhes de ${nome}`}
      >
        <div className={styles.imageWrapper}>
          <ProductImage imagemUrl={imagemUrl} alt={nome} cor={corHex} />
        </div>
      </Link>

      <div className={styles.details}>
        <div className={styles.header}>
          <div className={styles.info}>
            <Link to={`/produto/${produtoId}`} className={styles.titleLink}>
              <h3 className={styles.name}>{nome}</h3>
            </Link>
            {atributos ? <p className={styles.attributes}>{atributos}</p> : null}
          </div>

          <div className={styles.priceContainer}>
            <span className={styles.price}>{precoFormatado}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.stepperWrapper}>
            <QuantityStepper
              valor={quantidade}
              min={1}
              onChange={handleQuantidadeChange}
            />
          </div>

          <button
            type="button"
            className={styles.removeButton}
            onClick={handleRemover}
            aria-label={`Remover ${nome} da cesta`}
          >
            <Trash2 size={16} strokeWidth={1.8} aria-hidden="true" />
            <span>Remover</span>
          </button>
        </div>
      </div>
    </article>
  );
}
