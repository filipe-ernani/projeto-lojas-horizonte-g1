import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import useProduto from "@/hooks/useProduto";
import useSemelhantes from "@/hooks/useSemelhantes";
import useAvaliacoes from "@/hooks/useAvaliacoes";
import useFavoritos from "@/hooks/useFavoritos";
import useCarrinho from "@/hooks/useCarrinho";
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
 * - Conectada aos hooks useProduto, useSemelhantes e useAvaliacoes (D-22: id = sku).
 * - Cores e tamanhos vêm do produto.
 * - Regra D-07 só quando houver opções: se tamanhos for ["Único"], seleciona automaticamente sem pedir escolha.
 * - Se cores for [], omite o seletor de cor.
 * - Preço formatado exclusivamente com formatCurrency.
 * - Descrição vem diretamente da API (sem inventar "materiais").
 * - Se qtdAvaliacoes for 0 ou notaMedia for null: omite RatingPill e a seção de avaliações.
 * - Erro 404 exibe EmptyState com "Produto não encontrado" e link para o catálogo.
 */
export default function Produto({
  produto: produtoProp,
  avaliacoes: avaliacoesProp,
  produtosSemelhantes: semelhantesProp,
  onAdicionar,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    dados: produtoApi,
    carregando: carregandoProduto,
    erro: erroProduto,
    recarregar: recarregarProduto,
  } = useProduto(id);

  const { dados: semelhantesApi } = useSemelhantes(id);
  const { dados: avaliacoesApi } = useAvaliacoes(id);
  const { isFavorito, alternar } = useFavoritos();
  const { adicionar } = useCarrinho();

  const produto = produtoProp !== undefined ? produtoProp : produtoApi;
  const produtosSemelhantes =
    semelhantesProp !== undefined ? semelhantesProp : semelhantesApi;
  const avaliacoes =
    avaliacoesProp !== undefined ? avaliacoesProp : avaliacoesApi;

  const [corSelecionada, setCorSelecionada] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const [feedbackAdicao, setFeedbackAdicao] = useState("");

  // 1. Estado Carregando
  if (carregandoProduto) {
    return (
      <main className={`container ${styles.container}`}>
        <ProdutoSkeleton />
      </main>
    );
  }

  // 2. Erro 404 (Produto não encontrado)
  if (
    erroProduto?.status === 404 ||
    (!carregandoProduto && !produto && !erroProduto)
  ) {
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

  // 3. Erro de rede ou servidor
  if (erroProduto) {
    return (
      <main className={`container ${styles.container}`}>
        <EmptyState
          titulo="Não foi possível carregar o produto"
          mensagem="Não foi possível carregar. Tente novamente."
          textoAcao="Tentar de novo"
          onAcao={recarregarProduto}
        />
      </main>
    );
  }

  if (!produto) {
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
    notaMedia = null,
    qtdAvaliacoes = 0,
  } = produto;

  // Verificação de calçados (tamanhos puramente numéricos)
  const saoCalcados =
    Array.isArray(tamanhos) &&
    tamanhos.length > 0 &&
    tamanhos.every((t) => !Number.isNaN(Number(t)));

  // Regra D-07 só quando houver opções:
  // Se tamanhos for ["Único"] ou houver apenas 1 opção, seleciona automaticamente sem pedir escolha
  const eTamanhoUnico =
    Array.isArray(tamanhos) &&
    tamanhos.length === 1 &&
    (tamanhos[0] === "Único" || tamanhos[0] === "Unico");

  const precisaTamanho =
    Array.isArray(tamanhos) && tamanhos.length > 1 && !eTamanhoUnico;

  // Se cores for [], omite o seletor de cor
  const precisaCor = Array.isArray(cores) && cores.length > 1;

  const temCor = !precisaCor || Boolean(corSelecionada);
  const temTamanho = !precisaTamanho || Boolean(tamanhoSelecionado);
  const podeAdicionar = temCor && temTamanho;

  const tamanhoEfetivo = precisaTamanho
    ? tamanhoSelecionado
    : tamanhos?.[0] || null;

  const corEfetiva = precisaCor
    ? corSelecionada
    : cores?.[0] || null;

  const mensagemFalta = obterMensagemFalta({
    precisaCor,
    temCor,
    precisaTamanho,
    temTamanho,
    saoCalcados,
  });

  // Cor enviada para a galeria: a cor escolhida pelo usuário ou a primeira cor do produto
  const corGaleria = corSelecionada?.hex || cores?.[0]?.hex;

  const idProduto = produto?.id || produto?.sku || id;
  const favorito = isFavorito(idProduto);

  async function handleToggleFavorito() {
    const resultado = await alternar(idProduto, produto);
    if (resultado?.precisaLogin) {
      navigate("/login", { state: { from: location } });
    }
  }

  async function handleAdicionar() {
    if (!podeAdicionar || adicionando) {
      return;
    }

    setAdicionando(true);
    setFeedbackAdicao("");

    try {
      const corNome =
        typeof corEfetiva === "object" ? corEfetiva?.nome : corEfetiva;

      const resultado = await adicionar({
        produtoId: idProduto,
        tamanho: tamanhoEfetivo,
        cor: corNome || null,
        quantidade: 1,
      });

      if (resultado?.precisaLogin) {
        navigate("/login", { state: { from: location } });
        return;
      }

      setFeedbackAdicao("Produto adicionado à cesta!");
      if (typeof onAdicionar === "function") {
        onAdicionar({
          produto,
          cor: corEfetiva,
          tamanho: tamanhoEfetivo,
        });
      }

      setTimeout(() => {
        setFeedbackAdicao("");
      }, 3000);
    } catch {
      setFeedbackAdicao("Não foi possível adicionar o produto.");
    } finally {
      setAdicionando(false);
    }
  }

  // Avaliações: omitir quando qtdAvaliacoes for 0 ou notaMedia for null
  const temAvaliacoesValidas =
    notaMedia != null && Number(notaMedia) > 0 && Number(qtdAvaliacoes) > 0;

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

          {temAvaliacoesValidas ? (
            <div className={styles.ratingRow}>
              <RatingPill nota={notaMedia} qtdAvaliacoes={qtdAvaliacoes} />
            </div>
          ) : null}

          <div className={styles.priceRow}>
            <span className={styles.price}>{formatCurrency(preco)}</span>
          </div>

          {cores.length > 0 ? (
            <ProductColorSelector
              cores={cores}
              corSelecionada={corSelecionada}
              onSelecionarCor={setCorSelecionada}
            />
          ) : null}

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
            onToggleFavorito={handleToggleFavorito}
            adicionando={adicionando}
            feedbackAdicao={feedbackAdicao}
          />

          <ProductAccordions descricao={descricao} />
        </div>
      </div>

      {temAvaliacoesValidas ? (
        <ProductReviews avaliacoes={avaliacoes} />
      ) : null}

      <ProductSimilarSection produtos={produtosSemelhantes} />
    </main>
  );
}
