import { SlidersHorizontal } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import styles from "./CatalogoHeader.module.css";

const OPCOES_ORDENACAO = [
  { valor: "relevancia", rotulo: "Relevância" },
  { valor: "menor-preco", rotulo: "Menor preço" },
  { valor: "maior-preco", rotulo: "Maior preço" },
  { valor: "melhor-avaliados", rotulo: "Melhor avaliados" },
];

/**
 * Cabeçalho do Catálogo conforme docs/DESIGN.md:
 * Título, contagem de produtos, seletor de ordenação e botão mobile para abrir filtros.
 */
export default function CatalogoHeader({
  totalProdutos = 0,
  ordenar = "relevancia",
  busca = "",
  onMudarOrdenacao,
  onAbrirFiltrosMobile,
}) {
  const titulo = busca ? `Resultados para "${busca}"` : "Catálogo";

  return (
    <div className={styles.header}>
      <div className={styles.titleArea}>
        <h1 className={styles.title}>{titulo}</h1>
        <p className={styles.count}>
          {totalProdutos === 1
            ? "1 produto encontrado"
            : `${totalProdutos} produtos encontrados`}
        </p>
      </div>

      <div className={styles.controlsArea}>
        {/* Botão de abrir filtros (mobile/tablet) */}
        <Button
          variant="outline"
          size="sm"
          className={styles.filterButtonMobile}
          onClick={onAbrirFiltrosMobile}
          aria-label="Abrir painel de filtros"
        >
          <SlidersHorizontal size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>Filtrar</span>
        </Button>

        {/* Seletor de ordenação */}
        <div className={styles.sortGroup}>
          <label htmlFor="ordenar-select" className={styles.sortLabel}>
            Ordenar por:
          </label>
          <select
            id="ordenar-select"
            value={ordenar}
            onChange={(e) => onMudarOrdenacao && onMudarOrdenacao(e.target.value)}
            className={styles.sortSelect}
          >
            {OPCOES_ORDENACAO.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.rotulo}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
