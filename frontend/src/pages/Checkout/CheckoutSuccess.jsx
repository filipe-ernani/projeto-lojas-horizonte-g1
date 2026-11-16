import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import styles from "./CheckoutSuccess.module.css";

/**
 * Tela/bloco de sucesso do Checkout simulado conforme docs/DESIGN.md:
 * Confirmação de pedido com identificador recebido por props (sem dados fixos inventados),
 * resumo institucional e atalhos para /pedidos e /catalogo.
 * Acessibilidade: sem botões aninhados em links.
 */
export default function CheckoutSuccess({
  pedidoId,
  formaPagamento = "PIX",
}) {
  const navigate = useNavigate();

  const rotulosPagamento = {
    PIX: "Pix",
    CARTAO: "Cartão de crédito",
    BOLETO: "Boleto bancário",
  };

  const formaTexto = rotulosPagamento[formaPagamento] || formaPagamento;

  return (
    <div className={styles.container} role="region" aria-label="Confirmação de pedido">
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <CheckCircle2 size={56} strokeWidth={1.8} className={styles.icon} aria-hidden="true" />
        </div>

        <h1 className={styles.title}>Pedido realizado com sucesso!</h1>
        {pedidoId ? (
          <p className={styles.subtitle}>
            Número do pedido: <strong className={styles.orderNumber}>#{pedidoId}</strong>
          </p>
        ) : null}

        <div className={styles.infoBox}>
          {formaTexto ? (
            <p className={styles.infoText}>
              Forma de pagamento: <strong>{formaTexto}</strong> (simulado).
            </p>
          ) : null}
          <p className={styles.disclaimer}>
            Esta compra é uma <strong>simulação</strong> do MVP Horizonte. Nenhum pagamento real foi
            processado e nenhum produto físico será enviado.
          </p>
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => navigate("/pedidos")}
          >
            Ver meus pedidos
          </Button>

          <Button
            variant="outline"
            size="lg"
            fullWidth
            onClick={() => navigate("/catalogo")}
          >
            Continuar comprando
          </Button>
        </div>
      </div>
    </div>
  );
}
