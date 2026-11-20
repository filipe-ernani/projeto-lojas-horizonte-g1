import { X } from "lucide-react";
import styles from "./ActiveFilterChips.module.css";

/**
 * Exibe os chips de filtros atualmente ativos, permitindo remover individualmente.
 */
export default function ActiveFilterChips({
  filtros = {},
  onRemoverFiltro,
  onLimparTudo,
}) {
  const { categoria, busca, tamanho, precoMin, precoMax } = filtros;

  const itens = [];

  if (categoria) {
    itens.push({
      chave: "categoria",
      rotulo: `Categoria: ${categoria}`,
    });
  }

  if (tamanho) {
    itens.push({
      chave: "tamanho",
      rotulo: `Tamanho: ${tamanho}`,
    });
  }

  if (precoMin || precoMax) {
    const min = precoMin ? `R$ ${precoMin}` : "R$ 0";
    const max = precoMax ? `R$ ${precoMax}` : "...";
    itens.push({
      chave: "preco",
      rotulo: `Preço: ${min} até ${max}`,
    });
  }

  if (busca) {
    itens.push({
      chave: "busca",
      rotulo: `Busca: "${busca}"`,
    });
  }

  if (itens.length === 0) {
    return null;
  }

  return (
    <div className={styles.container} aria-label="Filtros ativos">
      <div className={styles.chipsList}>
        {itens.map((item) => (
          <span key={item.chave} className={styles.chip}>
            <span className={styles.chipLabel}>{item.rotulo}</span>
            <button
              type="button"
              className={styles.removeButton}
              onClick={() => onRemoverFiltro(item.chave)}
              aria-label={`Remover filtro ${item.rotulo}`}
            >
              <X size={14} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </span>
        ))}

        {onLimparTudo ? (
          <button
            type="button"
            className={styles.clearAllButton}
            onClick={onLimparTudo}
          >
            Limpar todos
          </button>
        ) : null}
      </div>
    </div>
  );
}
