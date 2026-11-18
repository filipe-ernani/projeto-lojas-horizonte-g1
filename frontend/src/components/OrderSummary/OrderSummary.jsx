import { useNavigate } from "react-router-dom";
import Button from "@/components/ui/Button/Button";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./OrderSummary.module.css";

/**
 * OrderSummary conforme docs/DESIGN.md:
 * Cartão --color-surface: Subtotal, Frete (simulado), Total grande e botão principal.
 * Texto "Compra simulada: nenhum pagamento real é feito."
 * O total NUNCA é calculado no front, apenas exibido via formatCurrency.
 */
export default function OrderSummary({
  subtotal = 0,
  frete = 0,
  total = 0,
  desabilitado = false,
  textoBotao = "Ir para o checkout",
  onAcao,
  para = "/checkout",
  className = "",
}) {
  const navigate = useNavigate();

  function handleClick() {
    if (desabilitado) {
      return;
    }
    if (onAcao) {
      onAcao();
    } else if (para) {
      navigate(para);
    }
  }

  const freteTexto = frete === 0 ? "Grátis" : formatCurrency(frete);

  return (
    <aside className={`${styles.card} ${className}`.trim()} aria-label="Resumo do pedido">
      <h2 className={styles.title}>Resumo do pedido</h2>

      <div className={styles.rows}>
        <div className={styles.row}>
          <span className={styles.label}>Subtotal</span>
          <span className={styles.value}>{formatCurrency(subtotal)}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Frete (simulado)</span>
          <span className={styles.value}>{freteTexto}</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.totalRow}>
        <span className={styles.totalLabel}>Total</span>
        <span className={styles.totalValue}>{formatCurrency(total)}</span>
      </div>

      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={desabilitado}
        onClick={handleClick}
        className={styles.checkoutButton}
      >
        {textoBotao}
      </Button>

      <p className={styles.disclaimer}>
        Compra simulada: nenhum pagamento real é feito.
      </p>
    </aside>
  );
}
