import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import useProdutos from "@/hooks/useProdutos";
import useCategorias from "@/hooks/useCategorias";
import ProductGrid from "@/components/ProductGrid/ProductGrid";
import FilterPanel from "@/components/FilterPanel/FilterPanel";
import Pagination from "@/components/Pagination/Pagination";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import CatalogoHeader from "./CatalogoHeader";
import ActiveFilterChips from "./ActiveFilterChips";
import CatalogoSkeleton from "./CatalogoSkeleton";
import styles from "./Catalogo.module.css";

// Tamanhos permitidos no filtro de catálogo (roupas adulto e calçados, conforme D-06/D-21)
const TAMANHOS_FILTRO = [
  "PP",
  "P",
  "M",
  "G",
  "GG",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
];

/**
 * Página de Catálogo (/catalogo) conforme docs/DESIGN.md e docs/API.md:
 * - Filtros lidos e sincronizados via URL (?categoria=, ?busca=, ?tamanho=, ?precoMin=, ?precoMax=, ?pagina=, ?ordenar=).
 * - Categorias e produtos obtidos diretamente dos hooks de dados reais (sem mocks, D-19).
 * - Estados: carregando (skeleton com blocos --color-surface), erro (tentar de novo) e vazio (apenas quando lista vier vazia).
 */
export default function Catalogo({
  produtos: produtosProp,
  categorias: categoriasProp,
  tamanhos: tamanhosProp,
  total: totalProp,
  totalPaginas: totalPaginasProp,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtrosAbertosMobile, setFiltrosAbertosMobile] = useState(false);

  // Filtros obtidos da URL (query string)
  const categoria = searchParams.get("categoria") || "";
  const busca = searchParams.get("busca") || "";
  const tamanho = searchParams.get("tamanho") || "";
  const precoMin = searchParams.get("precoMin") || "";
  const precoMax = searchParams.get("precoMax") || "";
  const ordenar = searchParams.get("ordenar") || "relevancia";
  const pagina = Math.max(1, Number(searchParams.get("pagina")) || 1);

  const filtrosQuery = {
    categoria,
    busca,
    tamanho,
    precoMin,
    precoMax,
    pagina,
    ordenar,
  };

  const {
    dados: produtosApi,
    total: totalApi,
    limite: limiteApi,
    carregando,
    atualizando,
    erro,
    recarregar,
  } = useProdutos(filtrosQuery);

  const { dados: categoriasApi } = useCategorias();

  const produtos = produtosProp !== undefined ? produtosProp : produtosApi;
  const categorias =
    categoriasProp !== undefined ? categoriasProp : categoriasApi;
  const tamanhos =
    tamanhosProp !== undefined ? tamanhosProp : TAMANHOS_FILTRO;
  const total = totalProp !== undefined ? totalProp : totalApi;

  const limite = limiteApi || 12;
  const totalPaginas =
    totalPaginasProp !== undefined
      ? totalPaginasProp
      : Math.max(1, Math.ceil(total / limite));

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

    // Resetar página para 1 quando qualquer filtro ou ordenação mudar
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
    const novos = new URLSearchParams();
    if (busca) {
      novos.set("busca", busca);
    }
    setSearchParams(novos);
    setFiltrosAbertosMobile(false);
  }

  // Usado quando a tela não tem resultado: a busca também sai da URL
  function handleLimparTudo() {
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

  function renderProdutos() {
    if (carregando) {
      return <CatalogoSkeleton />;
    }

    if (erro?.status === 400) {
      return (
        <EmptyState
          titulo="Não foi possível aplicar os filtros"
          mensagem={erro.message}
          textoAcao="Limpar filtros"
          onAcao={handleLimparTudo}
        />
      );
    }

    if (erro) {
      return (
        <EmptyState
          titulo="Não foi possível carregar o catálogo"
          mensagem="Não foi possível carregar. Tente novamente."
          textoAcao="Tentar de novo"
          onAcao={recarregar}
        />
      );
    }

    if ((produtos?.length ?? 0) === 0) {
      return (
        <EmptyState
          titulo="Nenhum produto encontrado"
          mensagem="Não encontramos produtos com os critérios selecionados. Tente ajustar os filtros ou fazer uma nova busca."
          textoAcao="Limpar filtros"
          onAcao={handleLimparTudo}
        />
      );
    }

    return (
      <>
        <ProductGrid produtos={produtos} />
        <Pagination
          paginaAtual={pagina}
          totalPaginas={totalPaginas}
          onMudarPagina={handleMudarPagina}
        />
      </>
    );
  }

  return (
    <div className={`container ${styles.main}`}>
      <CatalogoHeader
        totalProdutos={total}
        ordenar={ordenar}
        busca={busca}
        carregando={carregando}
        comErro={Boolean(erro)}
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

        <div className={styles.productsArea} aria-busy={atualizando}>
          <ActiveFilterChips
            filtros={filtrosAtivos}
            onRemoverFiltro={handleRemoverFiltro}
            onLimparTudo={handleLimparFiltros}
          />

          <p className={styles.statusAtualizacao} role="status">
            {atualizando ? "Atualizando resultados..." : ""}
          </p>

          {renderProdutos()}
        </div>
      </div>
    </div>
  );
}
