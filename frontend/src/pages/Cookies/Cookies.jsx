import styles from "./Cookies.module.css";

export default function Cookies() {
  return (
    <div className={`container ${styles.page}`}>
      <aside className={styles.avisoAcademico} role="note">
        <strong>Aviso:</strong> Projeto acadêmico (Lojas Horizonte) — conteúdo
        demonstrativo, não substitui revisão jurídica.
      </aside>

      <header className={styles.header}>
        <h1 className={styles.title}>Política de Cookies</h1>
        <p className={styles.lead}>
          Entenda como utilizamos cookies e armazenamento no navegador para
          proporcionar uma experiência limpa e segura.
        </p>
      </header>

      <section className={styles.section}>
        <h2>1. O que utilizamos</h2>
        <p>
          A Lojas Horizonte preza por uma arquitetura enxuta e transparente. Não
          utilizamos cookies intrusivos de publicidade direcionada, pixels de
          redes sociais ou rastreamento entre sites de terceiros.
        </p>
        <p>
          Nosso sistema faz uso apenas de tecnologias estritamente necessárias
          para o funcionamento do portal:
        </p>
        <ul className={styles.list}>
          <li>
            <strong>Preferência de Tema (localStorage):</strong> A chave{" "}
            <code>horizonte-theme</code> guarda se você prefere o modo claro ou
            escuro, garantindo que suas telas permaneçam consistentes ao navegar.
          </li>
          <li>
            <strong>Sessão de Usuário (Firebase Auth):</strong> Armazenamento
            técnico seguro de tokens de acesso para manter sua autenticação
            ativa enquanto navega.
          </li>
          <li>
            <strong>Identificador de Sessão (X-Sessao-Id):</strong> Cabeçalho
            volátil gerado para apoiar a análise anônima das etapas de compra do
            projeto.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>2. Como Gerenciar no seu Navegador</h2>
        <p>
          Você tem total controle sobre os dados armazenados em seu dispositivo. É
          possível limpar o histórico, cookies e armazenamento local a qualquer
          momento através das configurações de privacidade do seu navegador (como
          Chrome, Firefox, Safari ou Edge).
        </p>
        <p>
          Note que desativar o armazenamento local fará com que o tema retorne à
          preferência do sistema operacional e que seja necessário realizar login
          novamente a cada nova visita.
        </p>
      </section>
    </div>
  );
}
