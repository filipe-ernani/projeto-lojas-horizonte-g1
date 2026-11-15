import { Link } from "react-router-dom";
import { ArrowRight, Layers } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import styles from "./CategoryList.module.css";

/**
 * Lista de categorias em destaque conforme docs/DESIGN.md:
 * Círculos de 140 px (mobile-first com scroll suave ou grid),
 * nome da categoria abaixo e links levando a /catalogo?categoria=Nome.
 */
export default function CategoryList({
  categorias = [],
  titulo = "Categorias em destaque",
  linkVerTodos = "/catalogo",
  className = "",
}) {
  if (!categorias || categorias.length === 0) {
    return (
      <section className={`${styles.section} ${className}`.trim()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{titulo}</h2>
        </div>
        <EmptyState
          titulo="Nenhuma categoria disponível"
          mensagem="As categorias em destaque aparecerão assim que a API estiver conectada."
          textoAcao="Ver catálogo completo"
          para={linkVerTodos}
        />
      </section>
    );
  }

  return (
    <section
      className={`${styles.section} ${className}`.trim()}
      aria-labelledby="categorias-heading"
    >
      <div className={styles.header}>
        <h2 id="categorias-heading" className={styles.title}>
          {titulo}
        </h2>
        {linkVerTodos ? (
          <Link to={linkVerTodos} className={styles.viewAll}>
            <span>Ver todos</span>
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      <div className={styles.track}>
        {categorias.map((categoria) => (
          <Link
            key={categoria}
            to={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
            className={styles.item}
          >
            <div className={styles.circle}>
              <Layers className={styles.icon} size={32} strokeWidth={1.8} />
            </div>
            <span className={styles.categoryName}>{categoria}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
