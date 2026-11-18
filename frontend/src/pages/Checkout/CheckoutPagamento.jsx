import PaymentOptions from "@/components/PaymentOptions/PaymentOptions";
import styles from "./CheckoutPagamento.module.css";

/**
 * Seção de forma de pagamento do Checkout:
 * Exibe título e as opções de pagamento simuladas (Pix, crédito e débito).
 */
export default function CheckoutPagamento({
  formaPagamento,
  onSelecionar,
  parcelas,
  onSelecionarParcelas,
  total,
}) {
  return (
    <section className={styles.section} aria-labelledby="secao-pagamento">
      <div className={styles.sectionHeader}>
        <h2 id="secao-pagamento" className={styles.sectionTitle}>
          Forma de pagamento
        </h2>
      </div>

      <PaymentOptions
        selecionado={formaPagamento}
        onSelecionar={onSelecionar}
        parcelas={parcelas}
        onSelecionarParcelas={onSelecionarParcelas}
        total={total}
      />
    </section>
  );
}
