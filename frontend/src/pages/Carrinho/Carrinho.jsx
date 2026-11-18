import { Link } from "react-router-dom";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import useCarrinho from "@/hooks/useCarrinho";
import CartItem from "@/components/CartItem/CartItem";
import OrderSummary from "@/components/OrderSummary/OrderSummary";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import CarrinhoSkeleton from "./CarrinhoSkeleton";
import styles from "./Carrinho.module.css";

/**
 * Página de Carrinho (/carrinho) conforme docs/DESIGN.md:
 * - Conectada diretamente ao useCarrinho (dados reais da API).
 * - Lista de CartItem + OrderSummary à direita (desktop) ou abaixo (mobile).
 * - Ações de alterar quantidade e remover item.
 * - Resumo com subtotal, frete (simulado) e total calculados pela API.
 * - Botão "Finalizar compra" direcionando para /checkout.
 * - Estados: carregando (skeleton), erro (com "Tentar de novo") e vazio.
 * - Sem dados mockados (D-19).
 */
export default function Carrinho({
  carrinho: carrinhoProp,
  estadoInicial,
  onAlterarQuantidade: onAlterarQuantidadeProp,
  onRemover: onRemoverProp,
}) {
  const {
    itens: itensContexto,
    subtotal: subtotalContexto,
    frete: freteContexto,
    total: totalContexto,
    carregando: carregandoContexto,
    erro: erroContexto,
    alterarQuantidade: alterarQtdContexto,
    remover: removerContexto,
    recarregar,
  } = useCarrinho();

  const itens =
    carrinhoProp?.itens !== undefined ? carrinhoProp.itens : itensContexto;
  const subtotal =
    carrinhoProp?.subtotal !== undefined
      ? carrinhoProp.subtotal
      : subtotalContexto;
  const frete =
    carrinhoProp?.frete !== undefined ? carrinhoProp.frete : freteContexto;
  const total =
    carrinhoProp?.total !== undefined ? carrinhoProp.total : totalContexto;

  const carregando =
    estadoInicial === "carregando" ||
    (carrinhoProp === undefined && carregandoContexto);
  const erro =
    estadoInicial === "erro"
      ? new Error("Falha ao carregar cesta")
      : carrinhoProp === undefined
        ? erroContexto
        : null;

  if (carregando) {
    return (
      <main className={`container ${styles.main}`}>
        <CarrinhoSkeleton />
      </main>
    );
  }

  if (erro) {
    return (
      <main className={`container ${styles.main}`}>
        <EmptyState
          titulo="Não foi possível carregar sua cesta"
          mensagem={
            erro?.message || "Não foi possível carregar. Tente novamente."
          }
          textoAcao="Tentar de novo"
          onAcao={recarregar}
        />
      </main>
    );
  }

  function handleAlterarQuantidade(alvo, novaQtd) {
    if (onAlterarQuantidadeProp) {
      onAlterarQuantidadeProp(alvo, novaQtd);
      return;
    }
    const item = typeof alvo === "object" ? alvo : { produtoId: alvo };
    alterarQtdContexto(
      item.produtoId || item.sku,
      item.tamanho,
      item.cor,
      novaQtd,
    );
  }

  function handleRemover(alvo) {
    if (onRemoverProp) {
      onRemoverProp(alvo);
      return;
    }
    const item = typeof alvo === "object" ? alvo : { produtoId: alvo };
    removerContexto(item.produtoId || item.sku, item.tamanho, item.cor);
  }

  const temItens = Array.isArray(itens) && itens.length > 0;
  const totalItens = temItens
    ? itens.reduce((acc, item) => acc + (Number(item.quantidade) || 1), 0)
    : 0;
  const rotuloItens = totalItens === 1 ? "item" : "itens";
  const subtituloCesta = temItens ? `${totalItens} ${rotuloItens}` : "0 itens";

  return (
    <main className={`container ${styles.main}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Sua cesta</h1>
        <p className={styles.subtitle}>{subtituloCesta}</p>
      </header>

      {!temItens ? (
        <EmptyState
          icone={ShoppingBag}
          titulo="Sua cesta está vazia"
          mensagem="Nenhum produto foi adicionado ainda. Explore nossos itens e encontre o look ideal para você."
          textoAcao="Explorar catálogo"
          para="/catalogo"
        />
      ) : (
        <div className={styles.layout}>
          <div className={styles.itemsColumn}>
            <div className={styles.itemsList}>
              {itens.map((item) => (
                <CartItem
                  key={`${item.produtoId}-${item.tamanho}-${item.cor}`}
                  item={item}
                  onAlterarQuantidade={handleAlterarQuantidade}
                  onRemover={handleRemover}
                />
              ))}
            </div>

            <div className={styles.footerActions}>
              <Link to="/catalogo" className={styles.continueLink}>
                <ChevronLeft size={16} strokeWidth={1.8} aria-hidden="true" />
                <span>Continuar comprando</span>
              </Link>
            </div>
          </div>

          <div className={styles.summaryColumn}>
            <OrderSummary
              subtotal={subtotal}
              frete={frete}
              total={total}
              desabilitado={!temItens}
              textoBotao="Finalizar compra"
              para="/checkout"
            />
          </div>
        </div>
      )}
    </main>
  );
}
