import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import RatingPill from "@/components/ui/RatingPill/RatingPill";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import { formatCurrency } from "@/utils/formatCurrency";
import ProductGallery from "./ProductGallery";
import ProductReviews from "./ProductReviews";
import ProductColorSelector from "./ProductColorSelector";
import ProductSizeSelector from "./ProductSizeSelector";
import ProductAccordions from "./ProductAccordions";
import ProductActionRow from "./ProductActionRow";
import ProductSimilarSection from "./ProductSimilarSection";
import ProdutoSkeleton from "./ProdutoSkeleton";
import { obterMensagemFalta } from "./produtoHelpers";
import styles from "./Produto.module.css";

/**
 * Página de Detalhes do Produto (/produto/:id) conforme docs/DESIGN.md e docs/API.md:
 * - Galeria de imagens sincronizada com a cor selecionada e categoria.
 * - Regra D-07 ajustada: exige cor só se houver cores, e tamanho só se houver >1 tamanho.
 * - Tamanho único é pré-considerado selecionado e exibido sem seletor.
 * - Sem cores cadastradas, o seletor de cor é omitido.
 */
export default function Produto({
  produto = null,
  avaliacoes = null,
  produtosSemelhantes = [],
  estadoInicial = "vazio",
  onAdicionar,
}) {
  const { id } = useParams();
  const [estado, setEstado] = useState(estadoInicial);
  const [corSelecionada, setCorSelecionada] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(null);
  const [favorito, setFavorito] = useState(false);

  if (estado === "carregando") {
    return (
      <main className={`container ${styles.container}`}>
        <ProdutoSkeleton />
      </main>
    );
  }

  if (estado === "erro") {
    return (
      <main className={`container ${styles.container}`}>
        <EmptyState
          titulo="Não foi possível carregar o produto"
          mensagem="Ocorreu um erro ao buscar os dados deste item. Verifique sua conexão e tente novamente."
          textoAcao="Tentar de novo"
          onAcao={() => setEstado("vazio")}
        />
      </main>
    );
  }

  if (estado === "vazio" || !produto) {
    return (
      <main className={`container ${styles.container}`}>
        <EmptyState
          titulo="Produto não encontrado"
          mensagem={`O produto solicitado (#${id || "indisponível"}) não foi encontrado ou não está mais disponível em nosso catálogo.`}
          textoAcao="Voltar ao catálogo"
          para="/catalogo"
        />
      </main>
    );
  }

  const {
    nome = "Produto",
    categoria = "",
    preco = 0,
    descricao = "",
    imagemUrl = null,
    imagens = [],
    cores = [],
    tamanhos = [],
    notaMedia,
    qtdAvaliacoes,
  } = produto;

  // Verificação de calçados (tamanhos puramente numéricos)
  const saoCalcados =
    Array.isArray(tamanhos) &&
    tamanhos.length > 0 &&
    tamanhos.every((t) => !Number.isNaN(Number(t)));

  // Regra D-07 ajustada: exige cor só se houver cores, e tamanho só se houver mais de uma opção
  const precisaCor = Array.isArray(cores) && cores.length > 0;
  const precisaTamanho = Array.isArray(tamanhos) && tamanhos.length > 1;

  const temCor = !precisaCor || Boolean(corSelecionada);
  const temTamanho = !precisaTamanho || Boolean(tamanhoSelecionado);
  const podeAdicionar = temCor && temTamanho;

  const tamanhoEfetivo = precisaTamanho
    ? tamanhoSelecionado
    : tamanhos?.[0] || null;

  const mensagemFalta = obterMensagemFalta({
    precisaCor,
    temCor,
    precisaTamanho,
    temTamanho,
    saoCalcados,
  });

  // Cor enviada para a galeria: a cor escolhida pelo usuário ou a primeira cor do produto
  const corGaleria = corSelecionada?.hex || cores?.[0]?.hex;

  function handleAdicionar() {
    if (!podeAdicionar) {
      return;
    }
    if (typeof onAdicionar === "function") {
      onAdicionar({
        produto,
        cor: corSelecionada,
        tamanho: tamanhoEfetivo,
      });
    }
  }

  return (
    <main className={`container ${styles.container}`}>
      <div className={styles.mainGrid}>
        <div className={styles.galleryColumn}>
          <ProductGallery
            imagemUrl={imagemUrl}
            imagens={imagens}
            nome={nome}
            cor={corGaleria}
            categoria={categoria}
          />
        </div>

        <div className={styles.infoColumn}>
          {categoria ? (
            <Link
              to={`/catalogo?categoria=${encodeURIComponent(categoria)}`}
              className={styles.categoryLink}
            >
              {categoria}
            </Link>
          ) : null}

          <h1 className={styles.title}>{nome}</h1>

          {notaMedia != null ? (
            <div className={styles.ratingRow}>
              <RatingPill nota={notaMedia} qtdAvaliacoes={qtdAvaliacoes} />
            </div>
          ) : null}

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatCurrency(preco)}</span>
          </div>

          <ProductColorSelector
            cores={cores}
            corSelecionada={corSelecionada}
            onSelecionarCor={setCorSelecionada}
          />

          <ProductSizeSelector
            tamanhos={tamanhos}
            saoCalcados={saoCalcados}
            tamanhoSelecionado={tamanhoSelecionado}
            onSelecionarTamanho={setTamanhoSelecionado}
          />

          {mensagemFalta ? (
            <p className={styles.helperMessage} role="status">
              {mensagemFalta}
            </p>
          ) : null}

          <ProductActionRow
            podeAdicionar={podeAdicionar}
            onAdicionar={handleAdicionar}
            favorito={favorito}
            onToggleFavorito={() => setFavorito((prev) => !prev)}
          />

          <ProductAccordions descricao={descricao} />
        </div>
      </div>

      <ProductReviews avaliacoes={avaliacoes} />
      <ProductSimilarSection produtos={produtosSemelhantes} />
    </main>
  );
}
