import { useSearchParams } from "react-router-dom";
import PageSkeleton from "@/components/PageSkeleton/PageSkeleton";

export default function Catalogo() {
  const [searchParams] = useSearchParams();
  const busca = searchParams.get("busca");

  const descricao = busca
    ? `Resultados para "${busca}" serão exibidos aqui quando a API estiver conectada.`
    : "O catálogo com filtros de preço, tamanho e categoria será carregado quando a API estiver pronta.";

  return (
    <PageSkeleton
      titulo="Catálogo"
      descricao={descricao}
      textoAcao="Voltar ao início"
      para="/"
    />
  );
}
