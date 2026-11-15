import PageSkeleton from "@/components/PageSkeleton/PageSkeleton";

export default function Perfil() {
  return (
    <PageSkeleton
      titulo="Meu perfil"
      descricao="Seus dados pessoais e endereços salvos aparecerão aqui quando a API estiver conectada."
      textoAcao="Ver meus pedidos"
      para="/pedidos"
    />
  );
}
