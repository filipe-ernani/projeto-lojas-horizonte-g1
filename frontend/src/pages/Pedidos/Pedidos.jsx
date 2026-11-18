import { Package } from "lucide-react";
import usePedidos from "@/hooks/usePedidos";
import AccountNav from "@/components/AccountNav/AccountNav";
import OrderCard from "@/components/OrderCard/OrderCard";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import PedidosSkeleton from "./PedidosSkeleton";
import styles from "./Pedidos.module.css";

/**
 * Página de Meus Pedidos (/pedidos) conforme docs/DESIGN.md:
 * - Conectada diretamente ao hook usePedidos (dados reais da API).
 * - Menu lateral de navegação da conta (Perfil, Meus pedidos, Favoritos, Sair).
 * - Lista de OrderCard (número, data com dataLocal, status com Badge, total, qtd de itens, Accordion e cancelamento).
 * - Estados: carregando (skeleton), erro (com "Tentar de novo") e vazio.
 * - Sem dados mockados (D-19).
 */
export default function Pedidos({
  pedidos: pedidosProp,
  estadoInicial,
  onCancelar: onCancelarProp,
}) {
  const {
    pedidos: pedidosApi,
    carregando: carregandoApi,
    erro: erroApi,
    cancelando,
    cancelarPedido,
    recarregar,
  } = usePedidos();

  const pedidos = pedidosProp !== undefined ? pedidosProp : pedidosApi;
  const carregando =
    estadoInicial === "carregando" ||
    (pedidosProp === undefined && carregandoApi);
  const erro =
    estadoInicial === "erro"
      ? new Error("Falha ao carregar pedidos")
      : pedidosProp === undefined
        ? erroApi
        : null;

  async function handleCancelar(id) {
    if (onCancelarProp) {
      return onCancelarProp(id);
    }
    return cancelarPedido(id);
  }

  const temPedidos = Array.isArray(pedidos) && pedidos.length > 0;
  const rotuloPedidos =
    pedidos.length === 1 ? "pedido realizado" : "pedidos realizados";
  const subtituloPedidos = temPedidos
    ? `${pedidos.length} ${rotuloPedidos}`
    : "Acompanhe o histórico de suas compras";

  function renderConteudo() {
    if (carregando) {
      return <PedidosSkeleton />;
    }

    if (erro) {
      return (
        <EmptyState
          titulo="Não foi possível carregar seus pedidos"
          mensagem={
            erro?.message || "Não foi possível carregar. Tente novamente."
          }
          textoAcao="Tentar de novo"
          onAcao={recarregar}
        />
      );
    }

    if (!temPedidos) {
      return (
        <EmptyState
          icone={Package}
          titulo="Você ainda não fez pedidos"
          mensagem="Quando você concluir uma compra, o histórico completo e o andamento aparecerão aqui."
          textoAcao="Explorar catálogo"
          para="/catalogo"
        />
      );
    }

    return (
      <div className={styles.ordersList}>
        {pedidos.map((pedido) => (
          <OrderCard
            key={pedido.id}
            pedido={pedido}
            onCancelar={handleCancelar}
            cancelando={cancelando}
          />
        ))}
      </div>
    );
  }

  return (
    <main className={`container ${styles.main}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Meus pedidos</h1>
        <p className={styles.subtitle}>{subtituloPedidos}</p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <AccountNav abaAtiva="pedidos" />
        </aside>

        <section className={styles.content} aria-label="Histórico de pedidos">
          {renderConteudo()}
        </section>
      </div>
    </main>
  );
}
