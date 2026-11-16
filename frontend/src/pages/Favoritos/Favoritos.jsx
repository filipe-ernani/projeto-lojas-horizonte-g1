import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ProductGrid from "@/components/ProductGrid/ProductGrid";
import Button from "@/components/ui/Button/Button";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import FavoritosSkeleton from "./FavoritosSkeleton";
import styles from "./Favoritos.module.css";

/**
 * Página de Favoritos (/favoritos) conforme docs/DESIGN.md:
 * - Grade com ProductGrid/ProductCard recebendo produtos por props (formato Produto do docs/API.md).
 * - Coração preenchido e botão "Escolher tamanho" abaixo de cada card levando a /produto/:id.
 * - Estados de carregando (skeleton), erro e vazio ("Você ainda não favoritou nada" com botão para /catalogo).
 * - Sem dados mockados: produtos e handler chegam por props.
 */
export default function Favoritos({
  produtos = [],
  estadoInicial = "vazio",
  onFavoritar,
}) {
  const navigate = useNavigate();
  const [estado, setEstado] = useState(estadoInicial);

  if (estado === "carregando") {
    return (
      <main className={`container ${styles.main}`}>
        <FavoritosSkeleton />
      </main>
    );
  }

  if (estado === "erro") {
    return (
      <main className={`container ${styles.main}`}>
        <EmptyState
          titulo="Não foi possível carregar os favoritos"
          mensagem="Ocorreu um erro ao carregar seus produtos favoritos. Tente novamente em instantes."
          textoAcao="Tentar de novo"
          onAcao={() => setEstado("vazio")}
        />
      </main>
    );
  }

  const temProdutos = produtos && produtos.length > 0;

  function renderAcaoEscolherTamanho(produto) {
    return (
      <Button
        variant="outline"
        size="sm"
        fullWidth
        onClick={() => navigate(`/produto/${produto.id}`)}
        aria-label={`Escolher tamanho para ${produto.nome}`}
      >
        Escolher tamanho
      </Button>
    );
  }

  return (
    <main className={`container ${styles.main}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Favoritos</h1>
        <p className={styles.subtitle}>
          {temProdutos
            ? `${produtos.length} ${produtos.length === 1 ? "item salvo" : "itens salvos"}`
            : "0 itens salvos"}
        </p>
      </header>

      {!temProdutos ? (
        <EmptyState
          titulo="Você ainda não favoritou nada"
          mensagem="Explore nosso catálogo e salve seus produtos preferidos para encontrá-los facilmente depois."
          textoAcao="Explorar catálogo"
          para="/catalogo"
        />
      ) : (
        <ProductGrid
          produtos={produtos}
          isFavorito={true}
          onFavoritar={onFavoritar}
          renderAcoes={renderAcaoEscolherTamanho}
        />
      )}
    </main>
  );
}
