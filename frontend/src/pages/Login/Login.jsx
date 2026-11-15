import PageSkeleton from "@/components/PageSkeleton/PageSkeleton";

export default function Login() {
  return (
    <main className="container">
      <PageSkeleton
        titulo="Entrar"
        descricao="A tela de login com Google, e-mail/senha e recuperação de senha por link será montada na próxima etapa."
        textoAcao="Voltar ao início"
        para="/"
      />
    </main>
  );
}
