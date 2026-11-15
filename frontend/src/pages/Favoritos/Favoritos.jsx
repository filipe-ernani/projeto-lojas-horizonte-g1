import PageSkeleton from "@/components/PageSkeleton/PageSkeleton";

export default function Favoritos() {
  return (
    <PageSkeleton
      titulo="Favoritos"
      descricao="Você ainda não tem produtos favoritos."
      textoAcao="Explorar catálogo"
      para="/catalogo"
    />
  );
}
