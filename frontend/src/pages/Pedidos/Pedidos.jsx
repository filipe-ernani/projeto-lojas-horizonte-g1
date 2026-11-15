import PageSkeleton from "@/components/PageSkeleton/PageSkeleton";

export default function Pedidos() {
  return (
    <PageSkeleton
      titulo="Meus pedidos"
      descricao="Você ainda não realizou nenhum pedido."
      textoAcao="Ir para o catálogo"
      para="/catalogo"
    />
  );
}
