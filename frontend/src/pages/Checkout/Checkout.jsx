import PageSkeleton from "@/components/PageSkeleton/PageSkeleton";

export default function Checkout() {
  return (
    <main className="container">
      <PageSkeleton
        titulo="Finalizar compra"
        descricao="Compra simulada: nenhum pagamento real é feito. Esta etapa será conectada aos endereços e ao resumo do pedido."
        textoAcao="Voltar à cesta"
        para="/carrinho"
      />
    </main>
  );
}
