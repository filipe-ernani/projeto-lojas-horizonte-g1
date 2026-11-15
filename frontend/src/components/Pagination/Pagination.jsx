import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Pagination.module.css";

/**
 * Paginação conforme docs/DESIGN.md:
 * Texto 14 px muted; paginação com quadrados de 44 px (atual: preto).
 */
export default function Pagination({
  paginaAtual = 1,
  totalPaginas = 1,
  onMudarPagina,
  className = "",
}) {
  if (totalPaginas <= 1) {
    return null;
  }

  // Gera lista de páginas para exibição
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  return (
    <nav
      className={`${styles.nav} ${className}`.trim()}
      aria-label="Paginação de produtos"
    >
      <button
        type="button"
        className={styles.arrowButton}
        disabled={paginaAtual <= 1}
        onClick={() => onMudarPagina && onMudarPagina(paginaAtual - 1)}
        aria-label="Página anterior"
      >
        <ChevronLeft size={20} strokeWidth={1.8} aria-hidden="true" />
      </button>

      <ul className={styles.pagesList}>
        {paginas.map((num) => {
          const isAtiva = num === paginaAtual;
          return (
            <li key={num}>
              <button
                type="button"
                className={`${styles.pageButton} ${isAtiva ? styles.active : ""}`}
                aria-current={isAtiva ? "page" : undefined}
                aria-label={`Página ${num}`}
                onClick={() => onMudarPagina && onMudarPagina(num)}
              >
                {num}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className={styles.arrowButton}
        disabled={paginaAtual >= totalPaginas}
        onClick={() => onMudarPagina && onMudarPagina(paginaAtual + 1)}
        aria-label="Próxima página"
      >
        <ChevronRight size={20} strokeWidth={1.8} aria-hidden="true" />
      </button>
    </nav>
  );
}
