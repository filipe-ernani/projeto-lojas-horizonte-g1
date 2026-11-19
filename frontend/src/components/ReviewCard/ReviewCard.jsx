import { useState } from "react";
import StarRating from "@/components/StarRating/StarRating";
import { formatDate } from "@/utils/formatDate";
import styles from "./ReviewCard.module.css";

const LIMITE_CARACTERES = 160;

/**
 * Cartão de avaliação conforme docs/DESIGN.md:
 * Fundo --color-search, avatar redondo, nome, data, StarRating, texto e "Ler mais".
 */
export default function ReviewCard({ avaliacao, className = "" }) {
  const [expandido, setExpandido] = useState(false);

  if (!avaliacao) {
    return null;
  }

  const {
    autor = "Cliente Horizonte",
    nota = 5,
    comentario = "",
    dataLocal,
    criadoEm,
    data,
  } = avaliacao;

  const textoComentario = comentario || "";
  const inicial = autor ? autor.trim().charAt(0).toUpperCase() : "C";
  const dataFonte = dataLocal || criadoEm || data;
  const dataFormatada = dataFonte ? formatDate(dataFonte) : "";

  const precisaTruncar = textoComentario.length > LIMITE_CARACTERES;
  const textoExibido =
    precisaTruncar && !expandido
      ? `${textoComentario.slice(0, LIMITE_CARACTERES).trim()}...`
      : textoComentario;

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
              <time className={styles.data} dateTime={dataFonte}>
                {dataFormatada}
              </time>
            ) : null}
          </div>
        </div>

        <StarRating nota={nota} tamanho={16} />
      </header>

      {textoExibido ? <p className={styles.comentario}>{textoExibido}</p> : null}

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
