import { Link } from "react-router-dom";
import Badge from "@/components/ui/Badge/Badge";
import Accordion from "@/components/ui/Accordion/Accordion";
import ProductImage from "@/components/ui/ProductImage/ProductImage";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import styles from "./OrderCard.module.css";

/**
 * OrderCard conforme docs/DESIGN.md:
 * Número do pedido, data (formatDate), Badge de status (FINALIZADO escuro, CANCELADO perigo),
 * total (formatCurrency), quantidade de itens e um Accordion para ver os itens detalhados.
 */
export default function OrderCard({ pedido }) {
  if (!pedido) {
    return null;
  }

  const {
    id,
    data,
    status = "FINALIZADO",
    total = 0,
    qtdItens,
    itens = [],
    enderecoResumo,
  } = pedido;

  const dataFormatada = formatDate(data);
  const totalFormatado = formatCurrency(total);
  const totalItens = qtdItens || itens.length || 0;

  const isFinalizado = status.toUpperCase() === "FINALIZADO";
  const isCancelado = status.toUpperCase() === "CANCELADO";

  const badgeVariante = isFinalizado
    ? "escuro"
    : isCancelado
      ? "perigo"
      : "neutro";

  const statusRotulo = isFinalizado
    ? "Finalizado"
    : isCancelado
      ? "Cancelado"
      : status;

  return (
    <article className={styles.card} aria-label={`Pedido número ${id}`}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.orderNumber}>Pedido #{id}</span>
          <span className={styles.orderDate}>{dataFormatada}</span>
        </div>

        <Badge variante={badgeVariante}>{statusRotulo}</Badge>
      </div>

      <div className={styles.metaRow}>
        <div className={styles.summaryInfo}>
          <span className={styles.itemsCount}>
            {totalItens} {totalItens === 1 ? "item" : "itens"}
          </span>
          {enderecoResumo ? (
            <span className={styles.addressSummary}>· Entregue em: {enderecoResumo}</span>
          ) : null}
        </div>

        <div className={styles.totalInfo}>
          <span className={styles.totalLabel}>Total:</span>
          <span className={styles.totalValue}>{totalFormatado}</span>
        </div>
      </div>

      {itens.length > 0 ? (
        <div className={styles.thumbnailsRow}>
          {itens.slice(0, 4).map((item, index) => (
            <div
              key={`${id}-thumb-${item.produtoId || index}`}
              className={styles.thumbnailWrapper}
              title={item.nome}
            >
              <ProductImage imagemUrl={item.imagemUrl} alt={item.nome} />
            </div>
          ))}
          {itens.length > 4 ? (
            <span className={styles.moreThumbnails}>+{itens.length - 4}</span>
          ) : null}
        </div>
      ) : null}

      {itens.length > 0 ? (
        <div className={styles.accordionWrapper}>
          <Accordion titulo="Ver itens do pedido">
            <ul className={styles.itemsList}>
              {itens.map((item, index) => {
                const itemKey = `${id}-${item.produtoId || index}-${item.tamanho}-${item.cor}`;
                const precoItemFormatado = formatCurrency(item.preco);

                return (
                  <li key={itemKey} className={styles.itemRow}>
                    <div className={styles.itemImageWrapper}>
                      <ProductImage imagemUrl={item.imagemUrl} alt={item.nome} />
                    </div>

                    <div className={styles.itemDetails}>
                      <Link
                        to={`/produto/${item.produtoId}`}
                        className={styles.itemTitleLink}
                      >
                        <h4 className={styles.itemName}>{item.nome}</h4>
                      </Link>

                      <p className={styles.itemMeta}>
                        Tamanho: {item.tamanho} · Cor: {item.cor} · Qtd:{" "}
                        {item.quantidade || 1}
                      </p>
                    </div>

                    <span className={styles.itemPrice}>{precoItemFormatado}</span>
                  </li>
                );
              })}
            </ul>
          </Accordion>
        </div>
      ) : null}
    </article>
  );
}
