import { useState } from "react";
import { Package } from "lucide-react";
import AccountNav from "@/components/AccountNav/AccountNav";
import OrderCard from "@/components/OrderCard/OrderCard";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import PedidosSkeleton from "./PedidosSkeleton";
import styles from "./Pedidos.module.css";

/**
 * Página de Meus Pedidos (/pedidos) conforme docs/DESIGN.md:
 * - Menu lateral de navegação da conta (Perfil, Meus pedidos, Favoritos, Sair).
 * - Lista de OrderCard (número, data, status com Badge, total, qtd de itens e Accordion com detalhes).
 * - Estados: carregando (skeleton), erro e vazio ("Você ainda não fez pedidos" com botão para /catalogo).
 * - Sem dados mockados: pedidos chegam por props.
 */
export default function Pedidos({
  pedidos = [],
  estadoInicial = "vazio",
}) {
  const [estado, setEstado] = useState(estadoInicial);

  const temPedidos = pedidos && pedidos.length > 0;
  const rotuloPedidos =
    pedidos.length === 1 ? "pedido realizado" : "pedidos realizados";
  const subtituloPedidos = temPedidos
    ? `${pedidos.length} ${rotuloPedidos}`
    : "Acompanhe o histórico de suas compras";

  function renderConteudo() {
    if (estado === "carregando") {
      return <PedidosSkeleton />;
    }
    if (estado === "erro") {
      return (
        <EmptyState
          titulo="Não foi possível carregar seus pedidos"
          mensagem="Ocorreu um erro ao buscar o seu histórico de pedidos. Tente novamente em instantes."
          textoAcao="Tentar de novo"
          onAcao={() => setEstado("vazio")}
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
          <OrderCard key={pedido.id} pedido={pedido} />
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
