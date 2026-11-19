import { useId } from "react";
import Radio from "@/components/ui/Radio/Radio";
import Select from "@/components/ui/Select/Select";
import { formatCurrency } from "@/utils/formatCurrency";
import styles from "./PaymentOptions.module.css";

const MAXIMO_PARCELAS = 12;
const OPCOES_PARCELAS = Array.from(
  { length: MAXIMO_PARCELAS },
  (_, indice) => indice + 1,
);

const FORMAS_PAGAMENTO = [
  {
    id: "PIX",
    titulo: "Pix",
    descricao: "A chave e o código são gerados ao finalizar o pedido.",
  },
  {
    id: "CARTAO_CREDITO",
    titulo: "Cartão de crédito",
    descricao: "Em até 12x sem juros. Nenhum dado de cartão é solicitado.",
  },
  {
    id: "CARTAO_DEBITO",
    titulo: "Cartão de débito",
    descricao: "Pagamento à vista. Nenhum dado de cartão é solicitado.",
  },
];

// Mesma regra da API: parcela sem juros, arredondada para cima ao centavo
function calcularValorParcela(total, parcelas) {
  const totalCentavos = Math.round(Number(total) * 100);
  return Math.ceil(totalCentavos / parcelas) / 100;
}

/**
 * PaymentOptions conforme docs/DESIGN.md:
 * Seleção de forma de pagamento no Checkout (Pix, crédito com parcelas e débito).
 * Totalmente simulado: nenhum dado de cartão é coletado nem sai do navegador.
 */
export default function PaymentOptions({
  selecionado = "PIX",
  onSelecionar,
  parcelas = 1,
  onSelecionarParcelas,
  total = 0,
  name = "formaPagamento",
}) {
  const parcelasId = useId();

  return (
    <div className={styles.container}>
      <fieldset className={styles.fieldset}>
        <legend className="sr-only">Escolha a forma de pagamento simulada</legend>

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
                    <span className={styles.tituloLinha}>
                      <span className={styles.titulo}>{forma.titulo}</span>
                      <span className={styles.selo}>SIMULADO</span>
                    </span>
                    <span className={styles.descricao}>{forma.descricao}</span>
                  </div>
                </Radio>

                {isAtivo && forma.id === "CARTAO_CREDITO" ? (
                  <div className={styles.parcelas}>
                    <Select
                      id={parcelasId}
                      label="Parcelas"
                      value={parcelas}
                      onChange={(e) =>
                        onSelecionarParcelas?.(Number(e.target.value))
                      }
                      options={OPCOES_PARCELAS.map((numero) => ({
                        value: numero,
                        label: `${numero}x de ${formatCurrency(
                          calcularValorParcela(total, numero),
                        )} sem juros`,
                      }))}
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </fieldset>

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
