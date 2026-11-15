import PageSkeleton from "@/components/PageSkeleton/PageSkeleton";

export default function Carrinho() {
  return (
    <PageSkeleton
      titulo="Sua cesta"
      descricao="Sua cesta está vazia no momento."
      textoAcao="Continuar comprando"
      para="/catalogo"
    />
  );
}
