import styles from "./Privacidade.module.css";

export default function Privacidade() {
  return (
    <main className={`container ${styles.page}`}>
      <aside className={styles.avisoAcademico} role="note">
        <strong>Aviso:</strong> Projeto acadêmico (Lojas Horizonte) — conteúdo
        demonstrativo, não substitui revisão jurídica.
      </aside>

      <header className={styles.header}>
        <h1 className={styles.title}>Política de Privacidade</h1>
        <p className={styles.lead}>
          Transparência total sobre como tratamos credenciais, dados de navegação
          e armazenamento local nesta aplicação.
        </p>
      </header>

      <section className={styles.section}>
        <h2>1. Autenticação e Credenciais (Firebase Auth)</h2>
        <p>
          O gerenciamento de contas, cadastro e autenticação de usuários é
          realizado através do serviço seguro <strong>Firebase Authentication</strong>{" "}
          (Google Identity Platform). Suportamos autenticação via conta Google
          (OAuth) e via e-mail e senha. As senhas são criptografadas pelos
          servidores do provedor e nunca são armazenadas diretamente em nosso
          banco de dados em texto simples.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Armazenamento Local (localStorage)</h2>
        <p>
          Utilizamos o armazenamento local do seu navegador exclusivamente para
          manter preferências de uso necessárias para a experiência visual:
        </p>
        <ul className={styles.list}>
          <li>
            <strong>horizonte-theme:</strong> Armazena sua escolha de tema
            visual ("dark" ou "light") para evitar oscilações ao navegar entre
            páginas.
          </li>
          <li>
            <strong>Sessão de autenticação:</strong> Tokens temporários do
            Firebase necessários para manter você conectado durante a visita.
          </li>
        </ul>
        <p>
          Não armazenamos dados bancários, números de cartão de crédito ou
          informações sensíveis de pagamento em seu navegador.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. Métricas e Cabeçalho X-Sessao-Id</h2>
        <p>
          Para fins estritamente analíticos de usabilidade e compreensão do funil
          de compras (produtos visualizados, adições à cesta e etapas do
          checkout), o sistema pode enviar um identificador de sessão pseudo-anônimo
          através do cabeçalho HTTP <code>X-Sessao-Id</code>. Esse identificador
          não é comercializado e não é cruzado com redes de publicidade de
          terceiros.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Seus Direitos</h2>
        <p>
          Você pode a qualquer momento atualizar seus dados cadastrais através da
          página "Meu Perfil" ou solicitar a exclusão de sua conta de testes
          entrando em contato com a equipe do projeto.
        </p>
      </section>
    </main>
  );
}
