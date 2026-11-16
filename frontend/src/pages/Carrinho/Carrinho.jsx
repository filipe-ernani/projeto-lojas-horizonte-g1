import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ShoppingBag } from "lucide-react";
import CartItem from "@/components/CartItem/CartItem";
import OrderSummary from "@/components/OrderSummary/OrderSummary";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import CarrinhoSkeleton from "./CarrinhoSkeleton";
import styles from "./Carrinho.module.css";

/**
 * Página de Carrinho (/carrinho) conforme docs/DESIGN.md:
 * - Lista de CartItem + OrderSummary à direita (desktop) ou abaixo (mobile).
 * - Link "Continuar comprando" levando a /catalogo.
 * - Suporta estados carregando (skeleton), erro e vazio ("Sua cesta está vazia").
 * - O total NUNCA é calculado no front: vem direto do objeto carrinho e é exibido com formatCurrency.
 * - Botão de checkout desabilitado se não houver itens.
 * - Sem dados mockados: itens, totais e handlers chegam por props.
 */
export default function Carrinho({
  carrinho = { itens: [], subtotal: 0, frete: 0, total: 0 },
  estadoInicial = "vazio",
  onAlterarQuantidade,
  onRemover,
}) {
  const [estado, setEstado] = useState(estadoInicial);

  const itens = carrinho?.itens || [];
  const subtotal = carrinho?.subtotal ?? 0;
  const frete = carrinho?.frete ?? 0;
  const total = carrinho?.total ?? 0;

  if (estado === "carregando") {
    return (
      <main className={`container ${styles.main}`}>
        <CarrinhoSkeleton />
      </main>
    );
  }

  if (estado === "erro") {
    return (
      <main className={`container ${styles.main}`}>
        <EmptyState
          titulo="Não foi possível carregar sua cesta"
          mensagem="Ocorreu um erro ao carregar os itens da sua cesta. Tente novamente em instantes."
          textoAcao="Tentar de novo"
          onAcao={() => setEstado("vazio")}
        />
      </main>
    );
  }

  const temItens = itens.length > 0;
  const totalItens = itens.reduce(
    (acc, item) => acc + (item.quantidade || 1),
    0,
  );
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
                  onAlterarQuantidade={onAlterarQuantidade}
                  onRemover={onRemover}
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
              textoBotao="Ir para o checkout"
              para="/checkout"
            />
          </div>
        </div>
      )}
    </main>
  );
}
