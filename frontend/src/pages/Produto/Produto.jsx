import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import IconButton from "@/components/ui/IconButton/IconButton";
import RatingPill from "@/components/ui/RatingPill/RatingPill";
import Accordion from "@/components/ui/Accordion/Accordion";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import { formatCurrency } from "@/utils/formatCurrency";
import ProductGallery from "./ProductGallery";
import ProductReviews from "./ProductReviews";
import ProductColorSelector from "./ProductColorSelector";
import ProductSizeSelector from "./ProductSizeSelector";
import ProductSimilarSection from "./ProductSimilarSection";
import ProdutoSkeleton from "./ProdutoSkeleton";
import styles from "./Produto.module.css";

function obterMensagemFalta({ temCor, temTamanho, saoCalcados }) {
  if (!temCor && !temTamanho) {
    return "Selecione uma cor e um tamanho para adicionar à cesta.";
  }
  if (!temCor) {
    return "Selecione uma cor para adicionar à cesta.";
  }
  if (!temTamanho) {
    const rotuloTipo = saoCalcados ? "número" : "tamanho";
    return `Selecione um ${rotuloTipo} para adicionar à cesta.`;
  }
  return "";
}

/**
 * Página de Detalhes do Produto (/produto/:id) conforme docs/DESIGN.md e docs/API.md:
 * - Galeria de imagens com proporção 4:5 e miniaturas.
 * - Detalhes: categoria, nome, preço formatado, RatingPill.
 * - Seletores de cor (ColorSwatch) e tamanho (Chip, com identificação de calçado).
 * - Regra D-07: "Adicionar à cesta" desabilitado até escolher cor e tamanho, com mensagem explicativa.
 * - Botão de favoritar apenas visual (IconButton com Heart).
 * - Acordeões: Descrição, Materiais e composição, Entrega e devoluções.
 * - Seção de avaliações com resumo e comentários (ReviewCard).
 * - Vitrine de produtos semelhantes.
 * - Estados: carregando (skeleton), erro e vazio ("Produto não encontrado").
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

  // Estados de página
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

  // Dados do produto
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

  // Verificação de calçados (tamanhos numéricos)
  const saoCalcados =
    Array.isArray(tamanhos) &&
    tamanhos.length > 0 &&
    tamanhos.every((t) => !Number.isNaN(Number(t)));

  // Validação da regra D-07 (exige escolher cor e tamanho)
  const precisaCor = Array.isArray(cores) && cores.length > 0;
  const precisaTamanho = Array.isArray(tamanhos) && tamanhos.length > 0;
  const temCor = !precisaCor || Boolean(corSelecionada);
  const temTamanho = !precisaTamanho || Boolean(tamanhoSelecionado);
  const podeAdicionar = temCor && temTamanho;
  const mensagemFalta = obterMensagemFalta({
    temCor,
    temTamanho,
    saoCalcados,
  });

  function handleAdicionar() {
    if (!podeAdicionar) {
      return;
    }
    if (typeof onAdicionar === "function") {
      onAdicionar({
        produto,
        cor: corSelecionada,
        tamanho: tamanhoSelecionado,
      });
    }
  }

  return (
    <main className={`container ${styles.container}`}>
      {/* Grid principal do produto */}
      <div className={styles.mainGrid}>
        {/* Coluna da esquerda: Galeria de imagens */}
        <div className={styles.galleryColumn}>
          <ProductGallery
            imagemUrl={imagemUrl}
            imagens={imagens}
            nome={nome}
          />
        </div>

        {/* Coluna da direita: Informações e seleção */}
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

          {/* Mensagem curta da regra D-07 */}
          {mensagemFalta ? (
            <p className={styles.helperMessage} role="status">
              {mensagemFalta}
            </p>
          ) : null}

          {/* Ações: Adicionar à cesta e Favoritar */}
          <div className={styles.actionRow}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={!podeAdicionar}
              onClick={handleAdicionar}
            >
              Adicionar à cesta
            </Button>

            <IconButton
              icone={Heart}
              rotulo={
                favorito
                  ? "Remover produto dos favoritos"
                  : "Adicionar produto aos favoritos"
              }
              ativo={favorito}
              tamanho={52}
              onClick={() => setFavorito((prev) => !prev)}
            />
          </div>

          {/* Acordeões de informação */}
          <div className={styles.accordions}>
            <Accordion titulo="Descrição" defaultOpen>
              <p className={styles.accordionParagraph}>
                {descricao || "Nenhuma descrição detalhada informada para este produto."}
              </p>
            </Accordion>

            <Accordion titulo="Entrega e devoluções">
              <p className={styles.accordionParagraph}>
                Envio disponível para todo o Brasil. Política de troca ou devolução garantida conforme as diretrizes da loja.
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Seção de Avaliações */}
      <ProductReviews avaliacoes={avaliacoes} />

      {/* Seção de Produtos Semelhantes */}
      <ProductSimilarSection produtos={produtosSemelhantes} />
    </main>
  );
}
