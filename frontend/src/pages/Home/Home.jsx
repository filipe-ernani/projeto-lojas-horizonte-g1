import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import CategoryList from "@/components/CategoryList/CategoryList";
import ProductGrid from "@/components/ProductGrid/ProductGrid";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import HomeHero from "./HomeHero";
import BenefitsBanner from "./BenefitsBanner";
import HomeSkeleton from "./HomeSkeleton";
import styles from "./Home.module.css";

/**
 * Página inicial (Home) conforme docs/DESIGN.md.
 * Sem dados mockados: estrutura montada com seções (hero, categorias, destaques e benefícios)
 * e suporte aos estados carregando, erro e vazio.
 */
export default function Home({
  categorias = [],
  produtos = [],
  estadoInicial = "vazio",
}) {
  const [estado, setEstado] = useState(estadoInicial);

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
          onAcao={() => setEstado("vazio")}
        />
        <BenefitsBanner />
      </main>
    );
  }

  return (
    <main className={`container ${styles.main}`}>
      <HomeHero />

      <BenefitsBanner />

      <CategoryList categorias={categorias} />

      <section className={styles.section} aria-labelledby="novidades-heading">
        <div className={styles.sectionHeader}>
          <h2 id="novidades-heading" className={styles.sectionTitle}>
            Novidades e destaques
          </h2>
          <Link to="/catalogo" className={styles.viewAll}>
            <span>Ver todos</span>
            <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
          </Link>
        </div>

        <ProductGrid
          produtos={produtos}
          emptyTitulo="Vitrine em preparação"
          emptyMensagem="Nenhum produto cadastrado no momento. Os itens serão exibidos assim que a API estiver disponível."
        />
      </section>
    </main>
  );
}
