import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import useProduto from "@/hooks/useProduto";
import useSemelhantes from "@/hooks/useSemelhantes";
import useAvaliacoes from "@/hooks/useAvaliacoes";
import useMinhaAvaliacao from "@/hooks/useMinhaAvaliacao";
import useFavoritos from "@/hooks/useFavoritos";
import useCarrinho from "@/hooks/useCarrinho";
import RatingPill from "@/components/ui/RatingPill/RatingPill";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import AvisoAcao from "@/components/AvisoAcao/AvisoAcao";
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
function ProdutoConteudo({
  produto: produtoProp,
  avaliacoes: avaliacoesProp,
  produtosSemelhantes: semelhantesProp,
  onAdicionar,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useAuth();

  const {
    dados: produtoApi,
    carregando: carregandoProduto,
    erro: erroProduto,
    recarregar: recarregarProduto,
  } = useProduto(id);

  const [paginaAvaliacoes, setPaginaAvaliacoes] = useState(1);

  const { dados: semelhantesApi } = useSemelhantes(id);
  const {
    avaliacoes: avaliacoesApi,
    carregando: carregandoAvaliacoes,
    carregandoMais: carregandoMaisAvaliacoes,
    erro: erroAvaliacoes,
    recarregar: recarregarAvaliacoes,
  } = useAvaliacoes(id, paginaAvaliacoes);
  const {
    podeAvaliar,
    avaliacao: minhaAvaliacao,
    carregando: carregandoMinha,
    erro: erroMinha,
    salvar: salvarMinhaAvaliacao,
    salvando: salvandoMinha,
    erroSalvar: erroSalvarMinha,
    recarregar: recarregarMinha,
  } = useMinhaAvaliacao(id);
  const {
    isFavorito,
    alternar,
    favoritosProntos,
    erro: erroFavoritos,
    erroAcao: erroAcaoFavoritos,
    limparErroAcao: limparErroFavoritos,
    recarregar: recarregarFavoritos,
  } = useFavoritos();
  const {
    adicionar,
    cestaPronta,
    erro: erroCesta,
    erroAcao: erroAcaoCesta,
    limparErroAcao: limparErroCesta,
    recarregar: recarregarCesta,
  } = useCarrinho();

  const produto = produtoProp !== undefined ? produtoProp : produtoApi;
  const produtosSemelhantes =
    semelhantesProp !== undefined ? semelhantesProp : semelhantesApi;
  const avaliacoes =
    avaliacoesProp !== undefined ? avaliacoesProp : avaliacoesApi;

  const [corSelecionada, setCorSelecionada] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState(null);
  const [adicionando, setAdicionando] = useState(false);
  const [feedbackAdicao, setFeedbackAdicao] = useState("");

  useEffect(() => {
    if (!carregandoProduto && location.hash === "#avaliacoes") {
      const el = document.getElementById("avaliacoes");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  }, [carregandoProduto, location.hash]);

  // 1. Estado Carregando
  if (carregandoProduto) {
    return (
      <div className={`container ${styles.container}`}>
        <ProdutoSkeleton />
      </div>
    );
  }

  // 2. Erro 404 (Produto não encontrado)
  if (
    erroProduto?.status === 404 ||
    (!carregandoProduto && !produto && !erroProduto)
  ) {
    return (
      <div className={`container ${styles.container}`}>
        <EmptyState
          titulo="Produto não encontrado"
          mensagem={`O produto solicitado (#${id || "indisponível"}) não foi encontrado ou não está mais disponível em nosso catálogo.`}
          textoAcao="Voltar ao catálogo"
          para="/catalogo"
        />
      </div>
    );
  }

  // 3. Erro de rede ou servidor
  if (erroProduto) {
    return (
      <div className={`container ${styles.container}`}>
        <EmptyState
          titulo="Não foi possível carregar o produto"
          mensagem="Não foi possível carregar. Tente novamente."
          textoAcao="Tentar de novo"
          onAcao={recarregarProduto}
        />
      </div>
    );
  }

  if (!produto) {
    return (
      <div className={`container ${styles.container}`}>
        <EmptyState
          titulo="Produto não encontrado"
          mensagem={`O produto solicitado (#${id || "indisponível"}) não foi encontrado ou não está mais disponível em nosso catálogo.`}
          textoAcao="Voltar ao catálogo"
          para="/catalogo"
        />
      </div>
    );
  }

  const {
    nome = "Produto",
    categoria = "",
    preco = 0,
    descricao = "",
    ocasioes = [],
    imagemUrl = null,
    imagens = [],
    cores = [],
    tamanhos = [],
    notaMedia = null,
    totalAvaliacoes,
    qtdAvaliacoes = 0,
  } = produto;

  const totalAv = Number(totalAvaliacoes ?? qtdAvaliacoes ?? 0) || 0;

  // "Número (calçado)" vale só para a categoria Calçados
  const saoCalcados =
    String(categoria)
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim()
      .toLowerCase() === "calcados";

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

  // Visitante pode clicar: a ação o leva para o login
  const adicionarDesabilitado = Boolean(usuario) && !cestaPronta;
  const favoritoDesabilitado = Boolean(usuario) && !favoritosProntos;

  async function handleToggleFavorito() {
    try {
      const resultado = await alternar(idProduto, produto);
      if (resultado?.precisaLogin) {
        navigate("/login", { state: { from: location } });
      }
    } catch {
      // A mensagem da falha chega por erroAcao de useFavoritos
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
      const corHex =
        typeof corEfetiva === "object" ? corEfetiva?.hex : null;

      const resultado = await adicionar({
        produtoId: idProduto,
        nome,
        preco,
        imagemUrl,
        tamanho: tamanhoEfetivo,
        cor: corNome || null,
        corHex: corHex || null,
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
      // A mensagem da falha chega por erroAcao de useCarrinho
    } finally {
      setAdicionando(false);
    }
  }

  // Avaliações: omitir pílula no topo quando totalAv for 0 ou notaMedia for null
  const temAvaliacoesValidas =
    notaMedia != null && Number(notaMedia) > 0 && totalAv > 0;

  return (
    <div className={`container ${styles.container}`}>
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
              <RatingPill nota={notaMedia} qtdAvaliacoes={totalAv} />
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
            adicionarDesabilitado={adicionarDesabilitado}
            favoritoDesabilitado={favoritoDesabilitado}
          />

          <AvisoAcao mensagem={erroAcaoCesta?.message} onFechar={limparErroCesta} />
          <AvisoAcao
            mensagem={erroAcaoFavoritos?.message}
            onFechar={limparErroFavoritos}
          />
          {erroCesta ? (
            <AvisoAcao
              mensagem="Não foi possível carregar sua cesta."
              textoAcao="Tentar de novo"
              onAcao={recarregarCesta}
            />
          ) : null}
          {erroFavoritos ? (
            <AvisoAcao
              mensagem="Não foi possível carregar seus favoritos."
              textoAcao="Tentar de novo"
              onAcao={recarregarFavoritos}
            />
          ) : null}

          <ProductAccordions descricao={descricao} ocasioes={ocasioes} />
        </div>
      </div>

      <ProductReviews
        avaliacoes={avaliacoes}
        carregando={produtoProp ? false : carregandoAvaliacoes}
        carregandoMais={carregandoMaisAvaliacoes}
        erro={produtoProp ? null : erroAvaliacoes}
        onRecarregar={() => {
          setPaginaAvaliacoes(1);
          recarregarAvaliacoes();
          recarregarProduto();
        }}
        onVerMais={() => setPaginaAvaliacoes((p) => p + 1)}
        usuario={usuario}
        podeAvaliar={podeAvaliar}
        minhaAvaliacao={minhaAvaliacao}
        carregandoMinha={carregandoMinha}
        erroMinha={erroMinha}
        onRecarregarMinha={recarregarMinha}
        onSalvarMinha={salvarMinhaAvaliacao}
        salvandoMinha={salvandoMinha}
        erroSalvarMinha={erroSalvarMinha}
      />

      <ProductSimilarSection produtos={produtosSemelhantes} />
    </div>
  );
}

/**
 * A key reinicia cor, tamanho e avisos ao navegar de um produto para outro.
 */
export default function Produto(props) {
  const { id } = useParams();
  return <ProdutoConteudo key={id} {...props} />;
}
