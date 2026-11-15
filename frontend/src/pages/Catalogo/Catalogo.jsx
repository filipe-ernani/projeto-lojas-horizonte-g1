import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductGrid from "@/components/ProductGrid/ProductGrid";
import FilterPanel from "@/components/FilterPanel/FilterPanel";
import Pagination from "@/components/Pagination/Pagination";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import CatalogoHeader from "./CatalogoHeader";
import ActiveFilterChips from "./ActiveFilterChips";
import CatalogoSkeleton from "./CatalogoSkeleton";
import styles from "./Catalogo.module.css";

/**
 * Página de Catálogo (/catalogo) conforme docs/DESIGN.md:
 * - Filtros por categoria, tamanho e faixa de preço (D-06).
 * - Sincronização de filtros na query string via useSearchParams.
 * - Suporte aos estados carregando (skeleton), erro e vazio.
 * - Sem dados mockados: recebe produtos, categorias e tamanhos via props.
 */
export default function Catalogo({
  produtos = [],
  categorias = [],
  tamanhos = [],
  total = 0,
  totalPaginas = 1,
  estadoInicial = "vazio",
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [estado, setEstado] = useState(estadoInicial);
  const [filtrosAbertosMobile, setFiltrosAbertosMobile] = useState(false);

  // Filtros obtidos da URL (query string)
  const categoria = searchParams.get("categoria") || "";
  const busca = searchParams.get("busca") || "";
  const tamanho = searchParams.get("tamanho") || "";
  const precoMin = searchParams.get("precoMin") || "";
  const precoMax = searchParams.get("precoMax") || "";
  const ordenar = searchParams.get("ordenar") || "relevancia";
  const pagina = Number(searchParams.get("pagina")) || 1;

  const filtrosAtivos = {
    categoria,
    busca,
    tamanho,
    precoMin,
    precoMax,
  };

  // Atualiza parâmetros na URL
  function atualizarParams(novosValores) {
    const novos = new URLSearchParams(searchParams);
    Object.entries(novosValores).forEach(([chave, valor]) => {
      if (valor !== undefined && valor !== null && valor !== "") {
        novos.set(chave, String(valor));
      } else {
        novos.delete(chave);
      }
    });

    // Resetar página para 1 quando qualquer filtro ou busca mudar
    if (!("pagina" in novosValores)) {
      novos.delete("pagina");
    }

    setSearchParams(novos);
  }

  function handleAlterarFiltro(chave, valor) {
    atualizarParams({ [chave]: valor });
  }

  function handleRemoverFiltro(chave) {
    if (chave === "preco") {
      atualizarParams({ precoMin: "", precoMax: "" });
      return;
    }
    atualizarParams({ [chave]: "" });
  }

  function handleLimparFiltros() {
    setSearchParams(new URLSearchParams());
    setFiltrosAbertosMobile(false);
  }

  function handleMudarOrdenacao(novaOrdenacao) {
    atualizarParams({ ordenar: novaOrdenacao });
  }

  function handleMudarPagina(novaPagina) {
    atualizarParams({ pagina: novaPagina });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (estado === "carregando") {
    return (
      <main className={`container ${styles.main}`}>
        <CatalogoSkeleton />
      </main>
    );
  }

  if (estado === "erro") {
    return (
      <main className={`container ${styles.main}`}>
        <EmptyState
          titulo="Não foi possível carregar os produtos"
          mensagem="Ocorreu um erro ao carregar o catálogo. Tente novamente em instantes."
          textoAcao="Tentar de novo"
          onAcao={() => setEstado("vazio")}
        />
      </main>
    );
  }

  return (
    <main className={`container ${styles.main}`}>
      <CatalogoHeader
        totalProdutos={produtos.length || total}
        ordenar={ordenar}
        busca={busca}
        onMudarOrdenacao={handleMudarOrdenacao}
        onAbrirFiltrosMobile={() => setFiltrosAbertosMobile(true)}
      />

      <div className={styles.layout}>
        <FilterPanel
          categorias={categorias}
          tamanhos={tamanhos}
          filtros={filtrosAtivos}
          onAlterarFiltro={handleAlterarFiltro}
          onLimparFiltros={handleLimparFiltros}
          onAplicar={() => setFiltrosAbertosMobile(false)}
          abertoMobile={filtrosAbertosMobile}
          onFecharMobile={() => setFiltrosAbertosMobile(false)}
        />

        <div className={styles.productsArea}>
          <ActiveFilterChips
            filtros={filtrosAtivos}
            onRemoverFiltro={handleRemoverFiltro}
            onLimparTudo={handleLimparFiltros}
          />

          {produtos.length === 0 ? (
            <EmptyState
              titulo="Nenhum produto encontrado"
              mensagem="Não encontramos produtos com os critérios selecionados. Tente ajustar os filtros ou fazer uma nova busca."
              textoAcao="Limpar filtros"
              onAcao={handleLimparFiltros}
            />
          ) : (
            <>
              <ProductGrid produtos={produtos} />
              <Pagination
                paginaAtual={pagina}
                totalPaginas={totalPaginas}
                onMudarPagina={handleMudarPagina}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
