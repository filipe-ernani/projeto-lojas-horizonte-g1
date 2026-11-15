import PageSkeleton from "@/components/PageSkeleton/PageSkeleton";

export default function Home() {
  return (
    <PageSkeleton
      titulo="Horizonte"
      descricao="Descubra seu estilo e elegância. A vitrine será carregada quando os dados da API estiverem disponíveis."
      textoAcao="Ver catálogo"
      para="/catalogo"
    />
  );
}
