import { useState } from "react";
import { Link } from "react-router-dom";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Accordion from "@/components/ui/Accordion/Accordion";
import ProductImage from "@/components/ui/ProductImage/ProductImage";
import AvisoAcao from "@/components/AvisoAcao/AvisoAcao";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatDate } from "@/utils/formatDate";
import styles from "./OrderCard.module.css";

/**
 * OrderCard conforme docs/DESIGN.md:
 * Número do pedido, data (priorizando dataLocal), Badge de status (FINALIZADO escuro, CANCELADO perigo),
 * total (formatCurrency), quantidade de itens, Accordion com detalhes e ação de cancelar quando permitido.
 */
export default function OrderCard({
  pedido,
  onCancelar,
  cancelando = false,
}) {
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  const [erroCancelamento, setErroCancelamento] = useState("");

  if (!pedido) {
    return null;
  }

  const {
    id,
    data,
    dataLocal,
    dataIso,
    criadoEm,
    status = "FINALIZADO",
    total = 0,
    qtdItens,
    itens = [],
    enderecoResumo,
  } = pedido;

  const dataReferencia = dataLocal || dataIso || data || criadoEm;
  const dataFormatada = formatDate(dataReferencia);
  const totalFormatado = formatCurrency(total);
  const totalItens = qtdItens || itens.length || 0;

  const isFinalizado = status?.toUpperCase() === "FINALIZADO";
  const isCancelado = status?.toUpperCase() === "CANCELADO";

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

  async function handleConfirmarCancelamento() {
    setConfirmandoCancelamento(false);
    setErroCancelamento("");
    if (!onCancelar) {
      return;
    }
    try {
      await onCancelar(id);
    } catch (err) {
      setErroCancelamento(
        err?.message || "Não foi possível cancelar o pedido. Tente novamente.",
      );
    }
  }

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
              key={`${id}-thumb-${item.produtoId || index}-${item.tamanho}-${item.cor}`}
              className={styles.thumbnailWrapper}
              title={item.nome}
            >
              <ProductImage
                imagemUrl={item.imagemUrl}
                alt={item.nome}
                cor={item.corHex}
              />
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
                const atributosItem = [
                  item.tamanho ? `Tamanho: ${item.tamanho}` : null,
                  item.cor ? `Cor: ${item.cor}` : null,
                  `Qtd: ${item.quantidade || 1}`,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <li key={itemKey} className={styles.itemRow}>
                    <div className={styles.itemImageWrapper}>
                      <ProductImage
                        imagemUrl={item.imagemUrl}
                        alt={item.nome}
                        cor={item.corHex}
                      />
                    </div>

                    <div className={styles.itemDetails}>
                      <Link
                        to={`/produto/${item.produtoId}`}
                        className={styles.itemTitleLink}
                      >
                        <h4 className={styles.itemName}>{item.nome}</h4>
                      </Link>

                      <p className={styles.itemMeta}>{atributosItem}</p>
                      {!isCancelado && item.produtoId ? (
                        <Link
                          to={`/produto/${item.produtoId}#avaliacoes`}
                          className={styles.itemAvaliarLink}
                        >
                          Avaliar
                        </Link>
                      ) : null}
                    </div>

                    <span className={styles.itemPrice}>{precoItemFormatado}</span>
                  </li>
                );
              })}
            </ul>
          </Accordion>
        </div>
      ) : null}

      {!isCancelado && onCancelar ? (
        <div className={styles.cardFooter}>
          <AvisoAcao
            mensagem={erroCancelamento}
            onFechar={() => setErroCancelamento("")}
          />
          {confirmandoCancelamento ? (
            <div className={styles.confirmBox} role="alert">
              <p className={styles.confirmText}>
                Tem certeza que deseja cancelar o pedido #{id}?
              </p>
              <div className={styles.confirmActions}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={cancelando}
                  onClick={handleConfirmarCancelamento}
                >
                  {cancelando ? "Cancelando..." : "Sim, cancelar pedido"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={cancelando}
                  onClick={() => setConfirmandoCancelamento(false)}
                >
                  Voltar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={cancelando}
              onClick={() => setConfirmandoCancelamento(true)}
              aria-label={`Cancelar pedido #${id}`}
            >
              Cancelar pedido
            </Button>
          )}
        </div>
      ) : null}
    </article>
  );
}
