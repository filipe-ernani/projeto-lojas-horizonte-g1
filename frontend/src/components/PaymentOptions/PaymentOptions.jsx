import Radio from "@/components/ui/Radio/Radio";
import styles from "./PaymentOptions.module.css";

const FORMAS_PAGAMENTO = [
  {
    id: "PIX",
    titulo: "Pix",
    descricao: "Aprovação imediata (simulação).",
  },
  {
    id: "CARTAO",
    titulo: "Cartão de crédito",
    descricao: "Simulação sem coleta de dados reais de cartão.",
  },
  {
    id: "BOLETO",
    titulo: "Boleto bancário",
    descricao: "Simulação com vencimento em 3 dias úteis.",
  },
];

/**
 * PaymentOptions conforme docs/DESIGN.md:
 * Seleção de forma de pagamento no Checkout (Pix, Cartão, Boleto) com Radio.
 * Totalmente simulado: exibe aviso explícito e não solicita dados bancários reais.
 */
export default function PaymentOptions({
  selecionado = "PIX",
  onSelecionar,
  name = "formaPagamento",
}) {
  return (
    <div className={styles.container}>
      <div className={styles.optionsList}>
        {FORMAS_PAGAMENTO.map((forma) => {
          const isAtivo = selecionado === forma.id;
          return (
            <div
              key={forma.id}
              className={`${styles.card} ${isAtivo ? styles.selected : ""}`}
              onClick={() => onSelecionar?.(forma.id)}
            >
              <Radio
                name={name}
                value={forma.id}
                checked={isAtivo}
                onChange={() => onSelecionar?.(forma.id)}
                className={styles.radioWrapper}
              >
                <div className={styles.content}>
                  <span className={styles.titulo}>{forma.titulo}</span>
                  <span className={styles.descricao}>{forma.descricao}</span>
                </div>
              </Radio>
            </div>
          );
        })}
      </div>

      <div className={styles.simulationBanner}>
        <p className={styles.simulationText}>
          <strong>Aviso de compra simulada:</strong> Nenhum valor real será
          cobrado. Não solicitamos nem armazenamos números de cartão ou
          dados financeiros.
        </p>
      </div>
    </div>
  );
}
