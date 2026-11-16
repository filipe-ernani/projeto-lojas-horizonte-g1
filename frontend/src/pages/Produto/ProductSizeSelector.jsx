import Chip from "@/components/ui/Chip/Chip";
import styles from "./Produto.module.css";

/**
 * Seletor de tamanhos ou numerações de calçados de produto.
 */
export default function ProductSizeSelector({
  tamanhos = [],
  saoCalcados = false,
  tamanhoSelecionado = null,
  onSelecionarTamanho,
}) {
  if (!Array.isArray(tamanhos) || tamanhos.length === 0) {
    return null;
  }

  const tituloLegenda = saoCalcados ? "Número (calçado)" : "Tamanho";

  return (
    <fieldset className={styles.selectorGroup}>
      <legend className={styles.selectorLegend}>
        <span className={styles.selectorTitle}>{tituloLegenda}</span>
        {tamanhoSelecionado ? (
          <span className={styles.selectedLabel}>
            : {tamanhoSelecionado}
          </span>
        ) : null}
      </legend>

      <div className={styles.optionsRow} role="radiogroup">
        {tamanhos.map((tamanho) => (
          <Chip
            key={tamanho}
            selected={tamanhoSelecionado === tamanho}
            onClick={() => onSelecionarTamanho?.(tamanho)}
          >
            {tamanho}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}
