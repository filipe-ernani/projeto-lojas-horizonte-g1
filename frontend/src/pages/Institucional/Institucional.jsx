import styles from "./Institucional.module.css";

export default function Institucional() {
  return (
    <div className={`container ${styles.page}`}>
      <aside className={styles.avisoAcademico} role="note">
        <strong>Aviso:</strong> Projeto acadêmico (Lojas Horizonte) — conteúdo
        demonstrativo, não substitui revisão jurídica.
      </aside>

      <header className={styles.header}>
        <h1 className={styles.title}>Sobre a Lojas Horizonte</h1>
        <p className={styles.lead}>
          Moda contemporânea com design acolhedor, tecidos selecionados e
          compromisso com a transparência em cada detalhe.
        </p>
      </header>

      <section className={styles.section}>
        <h2>Nossa Proposta</h2>
        <p>
          A Horizonte nasceu do desejo de unir simplicidade, sofisticação e
          conforto em peças versáteis que acompanham o ritmo do dia a dia.
          Acreditamos que vestir-se bem deve ser uma experiência leve e
          acessível, sem excessos ou promessas exageradas.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Pilares de Atuação</h2>
        <ul className={styles.list}>
          <li>
            <strong>Design Atemporal:</strong> Peças criadas para durar, com
            cortes geométricos limpos e paleta de cores terrosas e contemporâneas.
          </li>
          <li>
            <strong>Acessibilidade e Usabilidade:</strong> Nossa loja digital é
            desenvolvida seguindo padrões internacionais de acessibilidade (WCAG
            2.1 AA), suporte completo a tema escuro e navegação fluida em
            qualquer dispositivo.
          </li>
          <li>
            <strong>Transparência:</strong> Informações claras sobre materiais,
            origem das peças e simulação de compra honesta, sem taxas ocultas ou
            marketing enganoso.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Atendimento e Contato</h2>
        <p>
          Disponibilizamos suporte digital contínuo através do nosso assistente
          inteligente e canais acadêmicos para esclarecer dúvidas sobre a
          plataforma e sugestões de melhoria.
        </p>
      </section>
    </div>
  );
}
