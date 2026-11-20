import { useRef, useState } from "react";
import { Star } from "lucide-react";
import styles from "./StarRating.module.css";

const ESTRELAS = [1, 2, 3, 4, 5];

/**
 * Componente de avaliação por estrelas:
 * - Modo exibição: mostra nota decimal com preenchimento proporcional e aria-label acessível.
 * - Modo entrada: grupo de rádios acessível, navegável por teclado (setas/Home/End).
 */
export default function StarRating({
  nota = 0,
  valor,
  onChange,
  modo,
  tamanho = 18,
  desabilitado = false,
  className = "",
}) {
  const [hoverValor, setHoverValor] = useState(0);
  const botoesRef = useRef([]);

  const eEntrada = modo === "entrada" || (modo !== "exibicao" && typeof onChange === "function");

  if (!eEntrada) {
    const notaNum = Math.max(0, Math.min(5, Number(nota) || 0));
    const notaTexto = notaNum.toFixed(1).replace(".", ",");

    return (
      <div
        className={`${styles.exibicao} ${className}`.trim()}
        role="img"
        aria-label={`${notaTexto} de 5 estrelas`}
      >
        {ESTRELAS.map((n) => {
          const preenchimento = Math.max(0, Math.min(1, notaNum - (n - 1)));
          const larguraPct = Math.round(preenchimento * 100);

          return (
            <span key={n} className={styles.starBox} aria-hidden="true">
              <Star
                size={tamanho}
                strokeWidth={1.8}
                className={styles.starVazia}
              />
              {larguraPct > 0 ? (
                <span
                  className={styles.starOverlay}
                  style={{ width: `${larguraPct}%` }}
                >
                  <Star
                    size={tamanho}
                    strokeWidth={1.8}
                    className={styles.starPreenchida}
                  />
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
    );
  }

  const valorAtual = Number(valor) || 0;
  const valorVisual = hoverValor || valorAtual;

  function selecionar(n) {
    if (desabilitado || !onChange) return;
    onChange(n);
  }

  function handleKeyDown(e, index) {
    if (desabilitado) return;
    let proximo = null;

    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      proximo = index < 4 ? index + 1 : 0;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      proximo = index > 0 ? index - 1 : 4;
    } else if (e.key === "Home") {
      e.preventDefault();
      proximo = 0;
    } else if (e.key === "End") {
      e.preventDefault();
      proximo = 4;
    }

    if (proximo !== null) {
      const novaNota = ESTRELAS[proximo];
      selecionar(novaNota);
      botoesRef.current[proximo]?.focus();
    }
  }

  return (
    <div
      className={`${styles.entrada} ${className}`.trim()}
      role="radiogroup"
      aria-label="Selecionar nota de 1 a 5 estrelas"
      onMouseLeave={() => setHoverValor(0)}
    >
      {ESTRELAS.map((n, index) => {
        const selecionada = valorAtual === n;
        const preenchida = n <= valorVisual;
        const tabIndex =
          valorAtual >= 1 && valorAtual <= 5 ? (selecionada ? 0 : -1) : index === 0 ? 0 : -1;

        return (
          <button
            key={n}
            ref={(el) => {
              botoesRef.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selecionada}
            aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
            tabIndex={tabIndex}
            disabled={desabilitado}
            className={styles.starButton}
            onClick={() => selecionar(n)}
            onMouseEnter={() => setHoverValor(n)}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            <Star
              size={tamanho}
              strokeWidth={1.8}
              className={preenchida ? styles.starPreenchida : styles.starVazia}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
