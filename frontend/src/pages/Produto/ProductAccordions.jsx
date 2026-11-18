import Accordion from "@/components/ui/Accordion/Accordion";
import styles from "./Produto.module.css";

/**
 * Seção de acordeões informativos da página de Produto:
 * - Descrição do produto (texto SIMULADO de demonstração).
 * - Aviso de que entrega e devolução são SIMULADAS.
 */
export default function ProductAccordions({ descricao = "" }) {
  return (
    <div className={styles.accordions}>
      <Accordion titulo="Descrição" defaultOpen>
        <p className={styles.accordionParagraph}>
          {descricao
            ? `${descricao} (Descrição SIMULADA.)`
            : "Nenhuma descrição detalhada informada para este produto."}
        </p>
      </Accordion>

      <Accordion titulo="Entrega e devoluções">
        <p className={styles.accordionParagraph}>
          SIMULADO: esta loja é uma demonstração. Nenhum produto é enviado de
          verdade e não há troca ou devolução real.
        </p>
      </Accordion>
    </div>
  );
}
