import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Footprints,
  Home,
  Layers,
  Shirt,
  Smile,
  Sparkles,
  Sun,
  Watch,
} from "lucide-react";
import Button from "@/components/ui/Button/Button";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import styles from "./CategoryList.module.css";

const MAPA_ICONES = {
  Feminino: Sparkles,
  Masculino: Shirt,
  Infantil: Smile,
  Calçados: Footprints,
  Acessórios: Watch,
  Esporte: Activity,
  Beleza: Sparkles,
  Casa: Home,
  "Moda íntima e praia": Sun,
};

function obterIcone(categoria = "") {
  return MAPA_ICONES[categoria] || Layers;
}

export default function CategoryList({
  categorias = [],
  carregando = false,
  erro = null,
  onRecarregar,
  titulo = "Explore por categoria",
  linkVerTodos = "/catalogo",
  className = "",
}) {
  if (carregando) {
    return (
      <section className={`${styles.section} ${className}`.trim()} aria-busy="true">
        <div className={styles.header}>
          <h2 className={styles.title}>{titulo}</h2>
        </div>
        <div className={styles.track}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className={styles.item}>
              <div className={`${styles.circle} ${styles.skeletonCircle}`} />
              <div className={styles.skeletonText} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (erro) {
    return (
      <section className={`${styles.section} ${className}`.trim()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{titulo}</h2>
        </div>
        <div className={styles.errorState}>
          <p className={styles.errorText}>
            Não foi possível carregar as categorias no momento.
          </p>
          {onRecarregar ? (
            <Button variant="outline" size="sm" onClick={onRecarregar}>
              Tentar de novo
            </Button>
          ) : null}
        </div>
      </section>
    );
  }

  if (!categorias || categorias.length === 0) {
    return (
      <section className={`${styles.section} ${className}`.trim()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{titulo}</h2>
        </div>
        <EmptyState
          titulo="Nenhuma categoria disponível"
          mensagem="As categorias aparecerão assim que forem cadastradas no catálogo."
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
        {categorias.map((categoria) => {
          const Icone = obterIcone(categoria);
          return (
            <Link
              key={categoria}
              to={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
              className={styles.item}
            >
              <div className={styles.circle}>
                <Icone className={styles.icon} size={32} strokeWidth={1.8} />
              </div>
              <span className={styles.categoryName}>{categoria}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
