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
import ProductSilhouette from "@/components/ProductSilhouette/ProductSilhouette";
import { tipoDaPeca } from "@/components/ProductSilhouette/tipoDaPeca";
import { FORMAS } from "@/components/ProductSilhouette/formas";
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

function formatarAriaLabel(alt, categoria) {
  const base = alt?.trim() || "Produto";
  if (categoria) {
    return `${base} — ${categoria} (sem imagem disponível)`;
  }
  return `${base} (sem imagem disponível)`;
}

function extrairNomeProduto(produto, nome, alt) {
  if (produto?.nome) return produto.nome;
  if (nome) return nome;
  if (!alt || alt === "Imagem do produto") return "";
  return alt
    .replace(/^Foto principal de\s+/i, "")
    .replace(/^Miniatura\s+\d+.*$/i, "")
    .trim();
}

/**
 * Imagem de produto conforme docs/DESIGN.md e silhuetas SVG:
 * - Proporção 4:5, fundo derivado do token de superfície (--color-card), raio 16px (--radius-lg).
 * - Imagem real quando disponível (imagemUrl).
 * - Placeholder: silhueta da peça tingida com a cor do produto centralizada com padding de ~12%.
 * - Se o produto não tiver cor (ex.: Beleza), usa o neutro por padrão sem passar cor.
 * - Se a silhueta for desconhecida (retornar null), fallback para o ícone da categoria.
 */
export default function ProductImage({
  imagemUrl,
  alt = "Imagem do produto",
  cor,
  categoria,
  nome,
  produto,
  className = "",
}) {
  const [comErro, setComErro] = useState(false);

  const temImagem = Boolean(imagemUrl) && !comErro;

  const nomeProduto = extrairNomeProduto(produto, nome, alt);
  const corProduto = produto?.cores?.[0]?.hex || cor || produto?.cor || undefined;

  const tipo = tipoDaPeca(nomeProduto);
  const temSilhueta = Boolean(tipo && FORMAS[tipo]);

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
          role="img"
          aria-label={formatarAriaLabel(alt, categoria)}
        >
          {temSilhueta ? (
            <ProductSilhouette
              nome={nomeProduto}
              {...(corProduto ? { cor: corProduto } : {})}
              className={styles.silhueta}
            />
          ) : (
            createElement(resolverIcone(categoria), {
              className: styles.placeholderIcon,
              size: 48,
              strokeWidth: 1.8,
              "aria-hidden": "true",
            })
          )}
          <span className="sr-only">Sem imagem disponível</span>
        </div>
      )}
    </div>
  );
}
