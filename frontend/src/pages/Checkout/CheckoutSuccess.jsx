import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./CheckoutSuccess.module.css";

const ROTULOS_PAGAMENTO = {
  PIX: "Pix",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
};

/**
 * Valor do Pix SIMULADO com botão de copiar e retorno de sucesso ou erro.
 */
function CampoCopiavel({ rotulo, valor }) {
  const [retorno, setRetorno] = useState(null);

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setRetorno({ ok: true, texto: "Copiado!" });
    } catch {
      setRetorno({
        ok: false,
        texto: "Não foi possível copiar. Selecione o texto e copie manualmente.",
      });
    }
  }

  return (
    <div className={styles.campoPix}>
      <span className={styles.campoRotulo}>{rotulo}</span>
      <div className={styles.campoLinha}>
        <code className={styles.campoValor}>{valor}</code>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopiar}
          aria-label={`Copiar ${rotulo}`}
        >
          Copiar
        </Button>
      </div>
      <p
        className={retorno && !retorno.ok ? styles.retornoErro : styles.retorno}
        role="status"
      >
        {retorno?.texto || ""}
      </p>
    </div>
  );
}

/**
 * Tela/bloco de sucesso do Checkout simulado conforme docs/DESIGN.md:
 * Confirmação com os dados devolvidos pela API (sem dados fixos inventados),
 * Pix SIMULADO ou parcelas do crédito e atalhos para /pedidos e /catalogo.
 * Acessibilidade: sem botões aninhados em links.
 */
export default function CheckoutSuccess({ pedido, formaPagamento }) {
  const navigate = useNavigate();

  const pedidoId = pedido?.id;
  const pix = pedido?.pix;
  const formaTexto = formaPagamento
    ? ROTULOS_PAGAMENTO[formaPagamento] || formaPagamento
    : null;
  const mostrarParcelas =
    formaPagamento === "CARTAO_CREDITO" && pedido?.valorParcela != null;

  return (
    <div className={styles.container} role="region" aria-label="Confirmação de pedido">
      <div className={styles.card}>
        <div className={styles.iconWrapper}>
          <CheckCircle2 size={56} strokeWidth={1.8} className={styles.icon} aria-hidden="true" />
        </div>

        <h1 className={styles.title}>
          {pedidoId ? "Pedido realizado com sucesso!" : "Pedido realizado"}
        </h1>
        {pedidoId ? (
          <p className={styles.subtitle}>
            Número do pedido: <strong className={styles.orderNumber}>#{pedidoId}</strong>
          </p>
        ) : null}

        <div className={styles.infoBox}>
          {formaTexto ? (
            <p className={styles.infoText}>
              Forma de pagamento: <strong>{formaTexto}</strong> (SIMULADO).
            </p>
          ) : null}

          {mostrarParcelas ? (
            <p className={styles.infoText}>
              Parcelamento:{" "}
              <strong>
                {pedido.parcelas}x de {formatCurrency(pedido.valorParcela)}
              </strong>{" "}
              sem juros (SIMULADO).
            </p>
          ) : null}

          {pix?.chave ? (
            <CampoCopiavel rotulo="Chave Pix (SIMULADO)" valor={pix.chave} />
          ) : null}
          {pix?.codigoCopiaECola ? (
            <CampoCopiavel
              rotulo="Código copia e cola (SIMULADO)"
              valor={pix.codigoCopiaECola}
            />
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
