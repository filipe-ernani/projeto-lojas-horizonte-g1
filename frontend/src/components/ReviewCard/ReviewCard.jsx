import { useState } from "react";
import RatingPill from "@/components/ui/RatingPill/RatingPill";
import { formatDate } from "@/utils/formatDate";
import styles from "./ReviewCard.module.css";

const LIMITE_CARACTERES = 160;

/**
 * Cartão de avaliação conforme docs/DESIGN.md:
 * Fundo --color-search, avatar redondo, nome, data, RatingPill, texto e "Ler mais".
 */
export default function ReviewCard({ avaliacao, className = "" }) {
  const [expandido, setExpandido] = useState(false);

  if (!avaliacao) {
    return null;
  }

  const { autor = "Anônimo", nota = 5, comentario = "", data } = avaliacao;

  const inicial = autor ? autor.trim().charAt(0).toUpperCase() : "U";
  const dataFormatada = data ? formatDate(data) : "";

  const precisaTruncar = comentario.length > LIMITE_CARACTERES;
  const textoExibido =
    precisaTruncar && !expandido
      ? `${comentario.slice(0, LIMITE_CARACTERES).trim()}...`
      : comentario;

  return (
    <article className={`${styles.card} ${className}`.trim()}>
      <header className={styles.header}>
        <div className={styles.autorInfo}>
          <div className={styles.avatar} aria-hidden="true">
            {inicial}
          </div>
          <div className={styles.meta}>
            <span className={styles.autor}>{autor}</span>
            {dataFormatada ? (
              <time className={styles.data} dateTime={data}>
                {dataFormatada}
              </time>
            ) : null}
          </div>
        </div>

        <RatingPill nota={nota} />
      </header>

      <p className={styles.comentario}>{textoExibido}</p>

      {precisaTruncar ? (
        <button
          type="button"
          className={styles.lerMais}
          onClick={() => setExpandido((prev) => !prev)}
          aria-expanded={expandido}
        >
          {expandido ? "Ler menos" : "Ler mais"}
        </button>
      ) : null}
    </article>
  );
}
