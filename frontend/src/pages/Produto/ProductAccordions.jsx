import Accordion from "@/components/ui/Accordion/Accordion";
import styles from "./Produto.module.css";

/**
 * Seção de acordeões informativos da página de Produto:
 * - Descrição institucional do produto.
 * - Políticas gerais de entrega e devoluções.
 */
export default function ProductAccordions({ descricao = "" }) {
  return (
    <div className={styles.accordions}>
      <Accordion titulo="Descrição" defaultOpen>
        <p className={styles.accordionParagraph}>
          {descricao || "Nenhuma descrição detalhada informada para este produto."}
        </p>
      </Accordion>

      <Accordion titulo="Entrega e devoluções">
        <p className={styles.accordionParagraph}>
          Envio disponível para todo o Brasil. Política de troca ou devolução
          garantida conforme as diretrizes da loja.
        </p>
      </Accordion>
    </div>
  );
}
