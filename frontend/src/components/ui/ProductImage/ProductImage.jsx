import { useState, createElement } from "react";
import {
  Shirt,
  Footprints,
  Watch,
  Dumbbell,
  Sparkles,
  House,
  Waves,
} from "lucide-react";
import styles from "./ProductImage.module.css";

/**
 * Mapeamento de ícones centralizados por categoria (docs/DESIGN.md e contrato API):
 * - Feminino, Masculino e Infantil: Shirt
 * - Calçados: Footprints
 * - Acessórios: Watch
 * - Esporte: Dumbbell
 * - Beleza: Sparkles
 * - Casa: House
 * - Moda íntima e praia: Waves
 * - Desconhecida ou ausente: Shirt
 */
const ICONES_POR_CATEGORIA = {
  Feminino: Shirt,
  Masculino: Shirt,
  Infantil: Shirt,
  Calçados: Footprints,
  Calcados: Footprints,
  Acessórios: Watch,
  Acessorios: Watch,
  Esporte: Dumbbell,
  Beleza: Sparkles,
  Casa: House,
  "Moda íntima e praia": Waves,
  "Moda intima e praia": Waves,
};

function resolverIcone(categoria) {
  if (!categoria || typeof categoria !== "string") {
    return Shirt;
  }
  const limpo = categoria.trim();
  if (ICONES_POR_CATEGORIA[limpo]) {
    return ICONES_POR_CATEGORIA[limpo];
  }
  const normalizada = limpo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const mapa = {
    feminino: Shirt,
    masculino: Shirt,
    infantil: Shirt,
    calcados: Footprints,
    acessorios: Watch,
    esporte: Dumbbell,
    beleza: Sparkles,
    casa: House,
    "moda intima e praia": Waves,
  };

  return mapa[normalizada] || Shirt;
}

function hexParaRgb(hex) {
  if (!hex || typeof hex !== "string") return null;
  const limpo = hex.replace("#", "").trim();
  if (limpo.length === 3) {
    return [
      Number.parseInt(limpo[0] + limpo[0], 16),
      Number.parseInt(limpo[1] + limpo[1], 16),
      Number.parseInt(limpo[2] + limpo[2], 16),
    ];
  }
  if (limpo.length === 6) {
    return [
      Number.parseInt(limpo.slice(0, 2), 16),
      Number.parseInt(limpo.slice(2, 4), 16),
      Number.parseInt(limpo.slice(4, 6), 16),
    ];
  }
  return null;
}

function obterLuminosidade(hex) {
  const rgb = hexParaRgb(hex);
  if (!rgb) return 1;
  const [r, g, b] = rgb;
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return 1;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function obterCorIcone(hex) {
  if (!hex) return "var(--color-muted)";
  return obterLuminosidade(hex) < 0.5
    ? "var(--color-paper)"
    : "var(--color-ink)";
}

function formatarAriaLabel(alt, categoria) {
  const base = alt?.trim() || "Produto";
  if (categoria) {
    return `${base} — ${categoria} (sem imagem disponível)`;
  }
  return `${base} (sem imagem disponível)`;
}

/**
 * Imagem de produto conforme docs/DESIGN.md:
 * Proporção 4:5, fundo derivado da cor ou --color-card, raio 16px (--radius-lg).
 * Sem imagem ou em caso de erro: placeholder com ícone por categoria e contraste adaptativo.
 */
export default function ProductImage({
  imagemUrl,
  alt = "Imagem do produto",
  cor,
  categoria,
  className = "",
}) {
  const [comErro, setComErro] = useState(false);

  const temImagem = Boolean(imagemUrl) && !comErro;

  const estiloPlaceholder = cor
    ? {
        backgroundColor: `color-mix(in srgb, ${cor} 35%, var(--color-card))`,
      }
    : undefined;

  const estiloIcone = cor
    ? {
        color: obterCorIcone(cor),
        opacity: 0.9,
      }
    : undefined;

  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      {temImagem ? (
        <img
          src={imagemUrl}
          alt={alt}
          className={styles.image}
          loading="lazy"
          onError={() => setComErro(true)}
        />
      ) : (
        <div
          className={styles.placeholder}
          style={estiloPlaceholder}
          role="img"
          aria-label={formatarAriaLabel(alt, categoria)}
        >
          {createElement(resolverIcone(categoria), {
            className: styles.placeholderIcon,
            size: 48,
            strokeWidth: 1.8,
            "aria-hidden": "true",
            style: estiloIcone,
          })}
          <span className="sr-only">Sem imagem disponível</span>
        </div>
      )}
    </div>
  );
}
