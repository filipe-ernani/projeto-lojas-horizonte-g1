import { useState } from "react";
import { Shirt } from "lucide-react";
import styles from "./ProductImage.module.css";

/**
 * Imagem de produto conforme docs/DESIGN.md:
 * Proporção 4:5, fundo --color-card, raio 16px (--radius-lg).
 * Sem imagem ou em caso de erro: placeholder com ícone de camiseta cinza.
 */
export default function ProductImage({
  imagemUrl,
  alt = "Imagem do produto",
  className = "",
}) {
  const [comErro, setComErro] = useState(false);

  const temImagem = Boolean(imagemUrl) && !comErro;

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
          aria-label={alt || "Produto sem imagem disponível"}
        >
          <Shirt
            className={styles.placeholderIcon}
            size={48}
            strokeWidth={1.8}
            aria-hidden="true"
          />
          <span className="sr-only">Sem imagem disponível</span>
        </div>
      )}
    </div>
  );
}
