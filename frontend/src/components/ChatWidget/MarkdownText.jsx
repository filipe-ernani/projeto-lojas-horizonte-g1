import { Fragment, useMemo } from "react";
import { parseMarkdown } from "@/utils/markdown";
import styles from "./MarkdownText.module.css";

/**
 * Renderiza Markdown simples do assistente apenas com elementos React criados
 * a partir de texto (nunca HTML). Tags na resposta aparecem como texto literal.
 */
function Trechos({ trechos }) {
  return trechos.map((trecho, indice) => {
    switch (trecho.tipo) {
      case "negrito":
        return (
          <strong key={indice} className={styles.negrito}>
            <Trechos trechos={trecho.filhos} />
          </strong>
        );
      case "italico":
        return (
          <em key={indice}>
            <Trechos trechos={trecho.filhos} />
          </em>
        );
      case "codigo":
        return (
          <code key={indice} className={styles.codigo}>
            {trecho.valor}
          </code>
        );
      case "link":
        return (
          <a
            key={indice}
            href={trecho.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className={styles.link}
          >
            <Trechos trechos={trecho.filhos} />
          </a>
        );
      default:
        return <Fragment key={indice}>{trecho.valor}</Fragment>;
    }
  });
}

function Linhas({ linhas }) {
  return linhas.map((linha, indice) => (
    <Fragment key={indice}>
      {indice > 0 ? <br /> : null}
      <Trechos trechos={linha} />
    </Fragment>
  ));
}

export default function MarkdownText({ texto, className = "" }) {
  const blocos = useMemo(() => parseMarkdown(texto), [texto]);

  return (
    <div className={`${styles.markdown} ${className}`.trim()}>
      {blocos.map((bloco, indice) => {
        if (bloco.tipo === "titulo") {
          return (
            <p key={indice} className={styles.titulo}>
              <strong className={styles.negrito}>
                <Trechos trechos={bloco.trechos} />
              </strong>
            </p>
          );
        }
        if (bloco.tipo === "lista") {
          const Lista = bloco.ordenada ? "ol" : "ul";
          return (
            <Lista
              key={indice}
              className={bloco.ordenada ? styles.listaNumerada : styles.lista}
              start={bloco.ordenada && bloco.inicio !== 1 ? bloco.inicio : undefined}
            >
              {bloco.itens.map((item, indiceItem) => (
                <li key={indiceItem} className={styles.item}>
                  <Linhas linhas={item} />
                </li>
              ))}
            </Lista>
          );
        }
        return (
          <p key={indice} className={styles.paragrafo}>
            <Linhas linhas={bloco.linhas} />
          </p>
        );
      })}
    </div>
  );
}
