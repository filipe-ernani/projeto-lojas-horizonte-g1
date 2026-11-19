import Accordion from "@/components/ui/Accordion/Accordion";
import styles from "./Produto.module.css";

/**
 * Seção de acordeões informativos da página de Produto:
 * - Descrição real do catálogo e chips de ocasiões de uso (quando houver).
 * - Aviso de que entrega e devolução são SIMULADAS.
 */
export default function ProductAccordions({ descricao = "", ocasioes = [] }) {
  const listaOcasioes = Array.isArray(ocasioes)
    ? ocasioes.filter(Boolean)
    : [];

  return (
    <div className={styles.accordions}>
      <Accordion titulo="Descrição" defaultOpen>
        <p className={styles.accordionParagraph}>
          {descricao ||
            "Nenhuma descrição detalhada informada para este produto."}
        </p>

        {listaOcasioes.length > 0 ? (
          <ul className={styles.occasionChips} aria-label="Ocasiões de uso">
            {listaOcasioes.map((ocasiao) => (
              <li key={ocasiao} className={styles.occasionChip}>
                {ocasiao}
              </li>
            ))}
          </ul>
        ) : null}
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
