import { Star } from "lucide-react";
import ReviewCard from "@/components/ReviewCard/ReviewCard";
import styles from "./ProductReviews.module.css";

const ESTRELAS = [5, 4, 3, 2, 1];

/**
 * Seção de avaliações conforme docs/DESIGN.md e docs/API.md:
 * Resumo (nota média, total e distribuição de 5 a 1 estrelas) e lista de comentários.
 */
export default function ProductReviews({
  avaliacoes = null,
  className = "",
}) {
  const resumo = avaliacoes?.resumo || null;
  const itens = Array.isArray(avaliacoes?.itens) ? avaliacoes.itens : [];

  const notaMedia = resumo?.notaMedia != null ? Number(resumo.notaMedia).toFixed(1) : null;
  const total = resumo?.total ?? itens.length;
  const distribuicao = resumo?.distribuicao || {};

  return (
    <section
      className={`${styles.section} ${className}`.trim()}
      aria-labelledby="avaliacoes-heading"
    >
      <h2 id="avaliacoes-heading" className={styles.title}>
        Avaliações dos clientes
      </h2>

      {total > 0 || notaMedia ? (
        <div className={styles.summaryCard}>
          <div className={styles.scoreBlock}>
            <span className={styles.bigScore}>{notaMedia || "0.0"}</span>
            <div className={styles.starsWrapper}>
              <Star
                className={styles.starIcon}
                size={20}
                strokeWidth={1.8}
                aria-hidden="true"
              />
              <span className={styles.scoreLabel}>de 5.0</span>
            </div>
            <span className={styles.totalLabel}>
              {total} {total === 1 ? "avaliação" : "avaliações"}
            </span>
          </div>

          <div
            className={styles.distributionBlock}
            role="region"
            aria-label="Distribuição de estrelas"
          >
            {ESTRELAS.map((estrela) => {
              const qtd = distribuicao[estrela] || 0;
              const porcentagem = total > 0 ? Math.round((qtd / total) * 100) : 0;

              return (
                <div key={estrela} className={styles.distRow}>
                  <span className={styles.starLabel}>{estrela} estrelas</span>
                  <div
                    className={styles.track}
                    role="progressbar"
                    aria-valuenow={porcentagem}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${estrela} estrelas: ${qtd} avaliações (${porcentagem}%)`}
                  >
                    <div
                      className={styles.fill}
                      style={{ width: `${porcentagem}%` }}
                    />
                  </div>
                  <span className={styles.distCount}>{qtd}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {itens.length > 0 ? (
        <div className={styles.reviewsList}>
          {itens.map((avaliacao) => (
            <ReviewCard key={avaliacao.id} avaliacao={avaliacao} />
          ))}
        </div>
      ) : (
        <div className={styles.emptyReviews}>
          <p className={styles.emptyText}>
            Ainda não há comentários para este produto. Seja o primeiro a compartilhar sua experiência após a compra!
          </p>
        </div>
      )}
    </section>
  );
}
