import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import styles from "./CheckoutHeader.module.css";

/**
 * Cabeçalho simplificado de Checkout conforme docs/DESIGN.md:
 * Logo institucional, passos do checkout (Cesta, Entrega e pagamento, Confirmação)
 * e atalho para voltar à cesta.
 */
export default function CheckoutHeader({ passoAtivo = 2 }) {
  const passos = [
    { numero: 1, rotulo: "Cesta", para: "/carrinho" },
    { numero: 2, rotulo: "Entrega e pagamento" },
    { numero: 3, rotulo: "Confirmação" },
  ];

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <div className={styles.topRow}>
          <Link to="/carrinho" className={styles.backLink} aria-label="Voltar para a cesta">
            <ChevronLeft size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Voltar à cesta</span>
          </Link>

          <Link to="/" className={styles.logoLink} aria-label="Ir para a página inicial">
            <span className={styles.logo}>HORIZONTE</span>
          </Link>

          <div className={styles.spacer} />
        </div>

        <nav aria-label="Etapas do checkout" className={styles.stepsNav}>
          <ol className={styles.stepsList}>
            {passos.map((passo) => {
              const isAtivo = passo.numero === passoAtivo;
              const isConcluido = passo.numero < passoAtivo;

              return (
                <li
                  key={passo.numero}
                  className={`${styles.stepItem} ${isAtivo ? styles.active : ""} ${
                    isConcluido ? styles.completed : ""
                  }`}
                  aria-current={isAtivo ? "step" : undefined}
                >
                  <span className={styles.stepBadge}>{passo.numero}</span>
                  <span className={styles.stepLabel}>{passo.rotulo}</span>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </header>
  );
}
