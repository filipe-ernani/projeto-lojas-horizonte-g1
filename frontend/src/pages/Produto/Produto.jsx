import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import IconButton from "@/components/ui/IconButton/IconButton";
import RatingPill from "@/components/ui/RatingPill/RatingPill";
import Chip from "@/components/ui/Chip/Chip";
import ColorSwatch from "@/components/ui/ColorSwatch/ColorSwatch";
import Accordion from "@/components/ui/Accordion/Accordion";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import ProductGrid from "@/components/ProductGrid/ProductGrid";
import { formatCurrency } from "@/utils/formatCurrency";
import ProductGallery from "./ProductGallery";
import ProductReviews from "./ProductReviews";
import ProdutoSkeleton from "./ProdutoSkeleton";
import styles from "./Produto.module.css";

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

  let mensagemFalta = "";
  if (!temCor && !temTamanho) {
    mensagemFalta = "Selecione uma cor e um tamanho para adicionar à cesta.";
  } else if (!temCor) {
    mensagemFalta = "Selecione uma cor para adicionar à cesta.";
  } else if (!temTamanho) {
    mensagemFalta = `Selecione um ${saoCalcados ? "número" : "tamanho"} para adicionar à cesta.`;
  }

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

          {/* Seletor de Cores */}
          {precisaCor ? (
            <fieldset className={styles.selectorGroup}>
              <legend className={styles.selectorLegend}>
                <span className={styles.selectorTitle}>Cor</span>
                {corSelecionada ? (
                  <span className={styles.selectedLabel}>
                    : {corSelecionada.nome}
                  </span>
                ) : null}
              </legend>

              <div className={styles.optionsRow} role="radiogroup">
                {cores.map((cor) => {
                  const estaSelecionada =
                    corSelecionada?.nome === cor.nome ||
                    corSelecionada?.hex === cor.hex;

                  return (
                    <ColorSwatch
                      key={cor.nome || cor.hex}
                      cor={cor.hex}
                      nome={cor.nome}
                      selected={estaSelecionada}
                      onClick={() => setCorSelecionada(cor)}
                    />
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {/* Seletor de Tamanhos / Números */}
          {precisaTamanho ? (
            <fieldset className={styles.selectorGroup}>
              <legend className={styles.selectorLegend}>
                <span className={styles.selectorTitle}>
                  {saoCalcados ? "Número (calçado)" : "Tamanho"}
                </span>
                {tamanhoSelecionado ? (
                  <span className={styles.selectedLabel}>
                    : {tamanhoSelecionado}
                  </span>
                ) : null}
              </legend>

              <div className={styles.optionsRow} role="radiogroup">
                {tamanhos.map((tamanho) => {
                  const estaSelecionado = tamanhoSelecionado === tamanho;

                  return (
                    <Chip
                      key={tamanho}
                      selected={estaSelecionado}
                      onClick={() => setTamanhoSelecionado(tamanho)}
                    >
                      {tamanho}
                    </Chip>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

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

            <Accordion titulo="Materiais e composição">
              <p className={styles.accordionParagraph}>
                Confeccionado com fibras nobres selecionadas, acabamento estruturado e toque suave na pele. Instruções de lavagem na etiqueta interna.
              </p>
            </Accordion>

            <Accordion titulo="Entrega e devoluções">
              <p className={styles.accordionParagraph}>
                Entrega para todo o território nacional. Troca ou devolução facilitada em até 30 dias corridos após o recebimento.
              </p>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Seção de Avaliações */}
      <ProductReviews avaliacoes={avaliacoes} />

      {/* Seção de Produtos Semelhantes */}
      {Array.isArray(produtosSemelhantes) && produtosSemelhantes.length > 0 ? (
        <section
          className={styles.similarSection}
          aria-labelledby="semelhantes-heading"
        >
          <div className={styles.similarHeader}>
            <h2 id="semelhantes-heading" className={styles.similarTitle}>
              Produtos semelhantes
            </h2>
          </div>

          <ProductGrid produtos={produtosSemelhantes} />
        </section>
      ) : null}
    </main>
  );
}
