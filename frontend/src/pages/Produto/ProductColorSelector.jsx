import ColorSwatch from "@/components/ui/ColorSwatch/ColorSwatch";
import styles from "./Produto.module.css";

/**
 * Seletor de cores de produto.
 */
export default function ProductColorSelector({
  cores = [],
  corSelecionada = null,
  onSelecionarCor,
}) {
  if (!Array.isArray(cores) || cores.length === 0) {
    return null;
  }

  return (
    <fieldset className={styles.selectorGroup}>
      <legend className={styles.selectorLegend}>
        <span className={styles.selectorTitle}>Cor</span>
        {corSelecionada?.nome ? (
          <span className={styles.selectedLabel}>
            : {corSelecionada.nome}
          </span>
        ) : null}
      </legend>

      <div className={styles.optionsRow} role="radiogroup">
        {cores.map((cor) => {
          const estaSelecionada =
            corSelecionada?.nome === cor.nome ||
            corSelecionada?.hex === cor.hex;

          return (
            <ColorSwatch
              key={cor.nome || cor.hex}
              cor={cor.hex}
              nome={cor.nome}
              selected={estaSelecionada}
              onClick={() => onSelecionarCor?.(cor)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
