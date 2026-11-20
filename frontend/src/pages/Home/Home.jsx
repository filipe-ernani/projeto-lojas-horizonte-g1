import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import useCategorias from "@/hooks/useCategorias";
import useNovidades from "@/hooks/useNovidades";
import CategoryList from "@/components/CategoryList/CategoryList";
import ProductCard from "@/components/ProductCard/ProductCard";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import HomeHero from "./HomeHero";
import BenefitsBanner from "./BenefitsBanner";
import EditorialBanner from "./EditorialBanner";
import styles from "./Home.module.css";

/**
 * Página Inicial (Home /) conforme docs/DESIGN.md e docs/API.md:
 * - Seção #novidades conectada ao hook useNovidades (D-25: 8 SKUs reais da API).
 * - Suporte completo aos 3 estados na seção de novidades (carregando, erro e vazio).
 * - Link "Ver catálogo" da seção direciona para /catalogo?ordenar=recentes.
 */
export default function Home({
  categorias: categoriasProp,
  produtos: produtosProp,
}) {
  // Hook de categorias real via API (sem mock hardcoded, D-19)
  const {
    dados: categoriasApi,
    carregando: carregandoCategorias,
    erro: erroCategorias,
    recarregar: recarregarCategorias,
  } = useCategorias();

  // Hook de novidades real via API (D-25)
  const {
    dados: novidadesApi,
    carregando: carregandoNovidades,
    erro: erroNovidades,
    recarregar: recarregarNovidades,
  } = useNovidades();

  const listaCategorias =
    categoriasProp !== undefined ? categoriasProp : categoriasApi;
  const estaCarregandoCategorias =
    categoriasProp === undefined && carregandoCategorias;
  const erroNasCategorias =
    categoriasProp === undefined ? erroCategorias : null;

  const novidades =
    produtosProp !== undefined ? produtosProp.slice(-8) : novidadesApi;

  return (
    <div className={`container ${styles.main}`}>
      <HomeHero />

      <BenefitsBanner />

      <CategoryList
        categorias={listaCategorias}
        carregando={estaCarregandoCategorias}
        erro={erroNasCategorias}
        onRecarregar={recarregarCategorias}
        titulo="Explore por categoria"
      />

      <section
        id="novidades"
        className={`${styles.section} ${styles.novidadesSection}`.trim()}
        aria-labelledby="novidades-heading"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="novidades-heading" className={styles.sectionTitle}>
              Novidades
            </h2>
            <p className={styles.sectionSubtitle}>
              Seleção SIMULADA de novidades para demonstração da loja
            </p>
          </div>
          <Link
            to="/catalogo?ordenar=recentes"
            className={styles.viewAll}
            aria-label="Ver catálogo completo ordenado pelos mais recentes"
          >
            <span>Ver catálogo</span>
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>

        {/* 1. Estado Carregando */}
        {carregandoNovidades ? (
          <div className={styles.novidadesGrid} aria-busy="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={styles.skeletonCard}
                style={{
                  aspectRatio: "4 / 5",
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-lg)",
                }}
              />
            ))}
          </div>
        ) : erroNovidades ? (
          /* 2. Estado Erro */
          <EmptyState
            titulo="Não foi possível carregar as novidades"
            mensagem="Não foi possível carregar. Tente novamente."
            textoAcao="Tentar de novo"
            onAcao={recarregarNovidades}
          />
        ) : novidades.length > 0 ? (
          /* Sucesso */
          <div className={styles.novidadesGrid}>
            {novidades.map((prod) => (
              <ProductCard key={prod.id} produto={prod} seloNovo />
            ))}
          </div>
        ) : (
          /* 3. Estado Vazio */
          <EmptyState
            titulo="Vitrine em preparação"
            mensagem="Os últimos lançamentos e novidades aparecerão assim que o catálogo for carregado."
            textoAcao="Explorar catálogo completo"
            para="/catalogo?ordenar=recentes"
          />
        )}
      </section>

      <EditorialBanner />
    </div>
  );
}
