import styles from "./Termos.module.css";

export default function Termos() {
  return (
    <div className={`container ${styles.page}`}>
      <aside className={styles.avisoAcademico} role="note">
        <strong>Aviso:</strong> Projeto acadêmico (Lojas Horizonte) — conteúdo
        demonstrativo, não substitui revisão jurídica.
      </aside>

      <header className={styles.header}>
        <h1 className={styles.title}>Termos de Uso</h1>
        <p className={styles.lead}>
          Condições e diretrizes para navegação, cadastro e testes na plataforma
          Lojas Horizonte.
        </p>
      </header>

      <section className={styles.section}>
        <h2>1. Natureza Acadêmica e Demonstrativa (Decisão D-12)</h2>
        <p>
          A Lojas Horizonte é uma aplicação desenvolvida com propósitos
          estritamente educacionais e demonstrativos. Todos os produtos,
          preços, estoques, avaliações e prazos exibidos constituem dados
          fictícios ou gerados para fins de demonstração do sistema.
        </p>
        <p>
          <strong>Atenção:</strong> Os fluxos de pagamento (Pix, Cartão de Crédito
          e Boleto Bancário) no checkout são totalmente simulados. Nenhuma
          cobrança monetária real é efetuada e nenhum produto físico será
          entregue.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Cadastro e Contas de Teste</h2>
        <p>
          O usuário é responsável por manter a confidencialidade de sua senha e
          pelo uso de seu e-mail cadastrado. Recomendamos a utilização de dados de
          teste, sem inserção de dados financeiros reais.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. Uso Adequado da Plataforma</h2>
        <p>
          É proibido tentar burlar sistemas de autenticação, injetar scripts
          maliciosos ou sobrecarregar a infraestrutura de APIs da plataforma. O
          ambiente é monitorado para garantir estabilidade e aprendizado.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Alterações e Atualizações</h2>
        <p>
          Por ser um projeto em evolução contínua, recursos podem ser
          adicionados, atualizados ou removidos conforme o roteiro acadêmico de
          entregas sem aviso prévio.
        </p>
      </section>
    </div>
  );
}
