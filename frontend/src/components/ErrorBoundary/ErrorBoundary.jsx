import { Component } from "react";
import Button from "@/components/ui/Button/Button";
import styles from "./ErrorBoundary.module.css";

/**
 * Captura erros de renderização e mostra uma mensagem em vez da tela branca.
 * Quando resetKey muda (troca de rota), tenta renderizar o conteúdo de novo.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { temErro: false };
    this.tentarDeNovo = this.tentarDeNovo.bind(this);
  }

  static getDerivedStateFromError() {
    return { temErro: true };
  }

  componentDidUpdate(propsAnteriores) {
    if (this.state.temErro && propsAnteriores.resetKey !== this.props.resetKey) {
      this.tentarDeNovo();
    }
  }

  tentarDeNovo() {
    this.setState({ temErro: false });
  }

  render() {
    if (!this.state.temErro) {
      return this.props.children;
    }

    return (
      <main className={`container ${styles.pagina}`}>
        <div className={styles.card} role="alert">
          <h1 className={styles.titulo}>Algo deu errado nesta página</h1>
          <p className={styles.mensagem}>
            Não foi possível exibir este conteúdo. Tente novamente ou volte
            para a página inicial.
          </p>
          <div className={styles.acoes}>
            <Button variant="primary" size="sm" onClick={this.tentarDeNovo}>
              Tentar de novo
            </Button>
            <a className={styles.link} href="/">
              Voltar para o início
            </a>
          </div>
        </div>
      </main>
    );
  }
}
