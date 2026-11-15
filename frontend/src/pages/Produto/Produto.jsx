import { useParams } from "react-router-dom";
import PageSkeleton from "@/components/PageSkeleton/PageSkeleton";

export default function Produto() {
  const { id } = useParams();

  return (
    <PageSkeleton
      titulo={`Produto #${id}`}
      descricao="Os detalhes, tamanhos, cores e avaliações deste produto serão exibidos aqui quando a API estiver conectada."
      textoAcao="Voltar ao catálogo"
      para="/catalogo"
    />
  );
}
