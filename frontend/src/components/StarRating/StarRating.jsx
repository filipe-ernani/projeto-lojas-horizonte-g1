import { useId, useRef, useState } from "react";
import { Star } from "lucide-react";
import styles from "./StarRating.module.css";

const ESTRELAS = [1, 2, 3, 4, 5];

// Mesmo desenho da estrela do lucide-react (viewBox 0 0 24 24, simétrica em x = 12).
const CAMINHO_ESTRELA =
  "M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z";

/** Arredonda para o meio-ponto mais próximo, dentro de 0 a 5 (3,7 -> 3,5; 3,8 -> 4). */
function arredondarMeioPonto(nota) {
  const n = Math.max(0, Math.min(5, Number(nota) || 0));
  return Math.round(n * 2) / 2;
}

/**
 * Uma estrela = um SVG: o mesmo path faz o preenchimento (gradiente com parada dura
 * em offset = fração) e o contorno, então a parte cheia nunca desalinha do traço.
 */
function EstrelaParcial({ fracao, tamanho, idGradiente }) {
  return (
    <svg
      className={styles.estrela}
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={idGradiente} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="0">
          <stop offset={fracao} className={styles.stopCheio} />
          <stop offset={fracao} className={styles.stopVazio} />
        </linearGradient>
      </defs>
      <path
        d={CAMINHO_ESTRELA}
        fill={`url(#${idGradiente})`}
        className={styles.contorno}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EstrelasExibicao({ nota, tamanho, className }) {
  const idBase = useId();
  const notaExibida = arredondarMeioPonto(nota);
  const notaTexto = notaExibida.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

  return (
    <div
      className={`${styles.exibicao} ${className}`.trim()}
      role="img"
      aria-label={`Nota ${notaTexto} de 5`}
    >
      {ESTRELAS.map((n, i) => (
        <EstrelaParcial
          key={n}
          fracao={Math.max(0, Math.min(1, notaExibida - i))}
          tamanho={tamanho}
          idGradiente={`${idBase}-estrela-${n}`}
        />
      ))}
    </div>
  );
}

/**
 * Componente de avaliação por estrelas:
 * - Modo exibição: nota arredondada ao meio-ponto, um SVG por estrela e aria-label "Nota 3,5 de 5".
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
    return <EstrelasExibicao nota={nota} tamanho={tamanho} className={className} />;
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
