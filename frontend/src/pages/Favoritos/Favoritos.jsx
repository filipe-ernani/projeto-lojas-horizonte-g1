import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import useFavoritos from "@/hooks/useFavoritos";
import useCarrinho from "@/hooks/useCarrinho";
import ProductGrid from "@/components/ProductGrid/ProductGrid";
import Button from "@/components/ui/Button/Button";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import FavoritosSkeleton from "./FavoritosSkeleton";
import styles from "./Favoritos.module.css";

/**
 * Página de Favoritos (/favoritos) conforme docs/DESIGN.md:
 * - Grade conectada ao useFavoritos (lista real da API).
 * - Ações de remover (coração) e adicionar ao carrinho / escolher tamanho.
 * - Estados de carregando (skeleton), erro (com "Tentar de novo") e vazio.
 * - Sem dados mockados (D-19).
 */
export default function Favoritos({
  produtos: produtosProp,
  estadoInicial,
  onFavoritar: onFavoritarProp,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    itens: itensApi,
    carregando: carregandoApi,
    erro: erroApi,
    recarregar,
    alternar,
  } = useFavoritos();

  const { adicionar } = useCarrinho();
  const [adicionandoId, setAdicionandoId] = useState(null);
  const [feedback, setFeedback] = useState("");

  const produtos = produtosProp !== undefined ? produtosProp : itensApi;
  const carregando =
    estadoInicial === "carregando" ||
    (produtosProp === undefined && carregandoApi);
  const erro =
    estadoInicial === "erro"
      ? new Error("Falha ao carregar")
      : produtosProp === undefined
        ? erroApi
        : null;

  if (carregando) {
    return (
      <main className={`container ${styles.main}`}>
        <FavoritosSkeleton />
      </main>
    );
  }

  if (erro) {
    return (
      <main className={`container ${styles.main}`}>
        <EmptyState
          titulo="Não foi possível carregar os favoritos"
          mensagem={
            erro?.message || "Não foi possível carregar. Tente novamente."
          }
          textoAcao="Tentar de novo"
          onAcao={recarregar}
        />
      </main>
    );
  }

  const temProdutos = Array.isArray(produtos) && produtos.length > 0;

  async function handleAdicionarAoCarrinho(produto) {
    const tamanhos = produto.tamanhos || [];
    const cores = produto.cores || [];
    const precisaTamanho =
      tamanhos.length > 1 &&
      tamanhos[0] !== "Único" &&
      tamanhos[0] !== "Unico";
    const precisaCor = cores.length > 1;

    // Se o produto exige escolher tamanho ou cor, vai para a página de produto
    if (precisaTamanho || precisaCor) {
      navigate(`/produto/${produto.id}`);
      return;
    }

    setAdicionandoId(produto.id);
    try {
      const corObj = cores[0];
      const corNome = typeof corObj === "object" ? corObj?.nome : corObj;
      const res = await adicionar({
        produtoId: produto.id,
        tamanho: tamanhos[0] || null,
        cor: corNome || null,
        quantidade: 1,
      });

      if (res?.precisaLogin) {
        navigate("/login", { state: { from: location } });
        return;
      }

      setFeedback(`"${produto.nome}" adicionado à cesta!`);
      setTimeout(() => setFeedback(""), 3000);
    } catch {
      setFeedback("Não foi possível adicionar o produto.");
    } finally {
      setAdicionandoId(null);
    }
  }

  function handleFavoritar(produto) {
    if (onFavoritarProp) {
      onFavoritarProp(produto);
      return;
    }
    alternar(produto.id, produto);
  }

  function renderAcoes(produto) {
    const tamanhos = produto.tamanhos || [];
    const cores = produto.cores || [];
    const precisaEscolher =
      (tamanhos.length > 1 &&
        tamanhos[0] !== "Único" &&
        tamanhos[0] !== "Unico") ||
      cores.length > 1;

    const estaAdicionando = adicionandoId === produto.id;

    return (
      <Button
        variant="primary"
        size="sm"
        fullWidth
        disabled={estaAdicionando}
        onClick={() => handleAdicionarAoCarrinho(produto)}
        aria-label={
          precisaEscolher
            ? `Escolher opções para ${produto.nome}`
            : `Adicionar ${produto.nome} à cesta`
        }
      >
        {estaAdicionando
          ? "Adicionando..."
          : precisaEscolher
            ? "Escolher opções"
            : "Adicionar à cesta"}
      </Button>
    );
  }

  const rotuloItens = produtos.length === 1 ? "item salvo" : "itens salvos";
  const subtituloFavoritos = temProdutos
    ? `${produtos.length} ${rotuloItens}`
    : "0 itens salvos";

  return (
    <main className={`container ${styles.main}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Favoritos</h1>
        <p className={styles.subtitle}>{subtituloFavoritos}</p>
      </header>

      {feedback ? (
        <p className={styles.feedbackAlert} role="status" aria-live="polite">
          {feedback}
        </p>
      ) : null}

      {!temProdutos ? (
        <EmptyState
          icone={Heart}
          titulo="Você ainda não favoritou nada"
          mensagem="Explore nosso catálogo e salve seus produtos preferidos para encontrá-los facilmente depois."
          textoAcao="Explorar catálogo"
          para="/catalogo"
        />
      ) : (
        <ProductGrid
          produtos={produtos}
          isFavorito={true}
          onFavoritar={handleFavoritar}
          renderAcoes={renderAcoes}
        />
      )}
    </main>
  );
}
