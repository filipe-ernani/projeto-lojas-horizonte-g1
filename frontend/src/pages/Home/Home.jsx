import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import CategoryList from "@/components/CategoryList/CategoryList";
import ProductCard from "@/components/ProductCard/ProductCard";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import HomeHero from "./HomeHero";
import BenefitsBanner from "./BenefitsBanner";
import EditorialBanner from "./EditorialBanner";
import HomeSkeleton from "./HomeSkeleton";
import styles from "./Home.module.css";

const CATEGORIAS_REAIS = [
  "Feminino",
  "Masculino",
  "Infantil",
  "Calçados",
  "Acessórios",
  "Esporte",
  "Beleza",
  "Casa",
  "Moda íntima e praia",
];

export default function Home({
  categorias,
  produtos = [],
  estadoInicial = "normal",
}) {
  const [estado, setEstado] = useState(estadoInicial);
  const location = useLocation();

  const listaCategorias =
    categorias && categorias.length > 0 ? categorias : CATEGORIAS_REAIS;

  // Decisão D-25: Os 8 últimos SKUs do catálogo recebem o selo "Novo"
  const novidades = produtos.slice(-8);

  useEffect(() => {
    if (location.hash === "#novidades" || window.location.hash === "#novidades") {
      const el = document.getElementById("novidades");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.hash]);

  if (estado === "carregando") {
    return (
      <main className={`container ${styles.main}`}>
        <HomeSkeleton />
      </main>
    );
  }

  if (estado === "erro") {
    return (
      <main className={`container ${styles.main}`}>
        <HomeHero />
        <EmptyState
          titulo="Não foi possível carregar a vitrine"
          mensagem="Ocorreu um erro ao buscar os dados da loja. Tente novamente em instantes."
          textoAcao="Tentar de novo"
          onAcao={() => setEstado("normal")}
        />
        <BenefitsBanner />
      </main>
    );
  }

  return (
    <main className={`container ${styles.main}`}>
      <HomeHero />

      <BenefitsBanner />

      <CategoryList
        categorias={listaCategorias}
        titulo="Explore por categoria"
      />

      <section
        id="novidades"
        className={styles.section}
        aria-labelledby="novidades-heading"
      >
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="novidades-heading" className={styles.sectionTitle}>
              Novidades
            </h2>
            <p className={styles.sectionSubtitle}>
              Últimos lançamentos com cortes contemporâneos e tecidos selecionados
            </p>
          </div>
          <Link to="/catalogo" className={styles.viewAll}>
            <span>Ver catálogo</span>
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>

        {novidades.length > 0 ? (
          <div className={styles.novidadesGrid}>
            {novidades.map((prod) => (
              <ProductCard key={prod.id} produto={prod} seloNovo />
            ))}
          </div>
        ) : (
          <EmptyState
            titulo="Vitrine em preparação"
            mensagem="Os últimos lançamentos e novidades aparecerão assim que o catálogo for carregado."
            textoAcao="Explorar catálogo completo"
            para="/catalogo"
          />
        )}
      </section>

      <EditorialBanner />
    </main>
  );
}
