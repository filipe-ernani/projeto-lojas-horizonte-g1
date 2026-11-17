import { useState } from "react";
import ProductImage from "@/components/ui/ProductImage/ProductImage";
import styles from "./ProductGallery.module.css";

/**
 * Galeria de imagens do produto conforme docs/DESIGN.md:
 * Imagem principal na proporção 4:5 e lista de miniaturas clicáveis.
 * Repassa cor ativa e categoria para enriquecer o placeholder do ProductImage.
 */
export default function ProductGallery({
  imagemUrl = null,
  imagens = [],
  nome = "Produto",
  cor,
  categoria,
}) {
  const listaImagens =
    Array.isArray(imagens) && imagens.length > 0
      ? imagens
      : imagemUrl
        ? [imagemUrl]
        : [];

  const [indiceAtivo, setIndiceAtivo] = useState(0);

  const imagemAtiva = listaImagens[indiceAtivo] || imagemUrl || null;

  return (
    <div className={styles.gallery}>
      <div className={styles.mainImageWrapper}>
        <ProductImage
          imagemUrl={imagemAtiva}
          alt={`Foto principal de ${nome}`}
          cor={cor}
          categoria={categoria}
          className={styles.mainImage}
        />
      </div>

      {listaImagens.length > 1 ? (
        <div
          className={styles.thumbnailList}
          role="region"
          aria-label="Miniaturas de fotos do produto"
        >
          {listaImagens.map((img, index) => {
            const estaAtiva = index === indiceAtivo;
            return (
              <button
                key={`${img}-${index}`}
                type="button"
                className={`${styles.thumbnailBtn} ${estaAtiva ? styles.thumbnailAtiva : ""}`}
                onClick={() => setIndiceAtivo(index)}
                aria-label={`Ver foto ${index + 1} de ${listaImagens.length}`}
                aria-pressed={estaAtiva}
              >
                <ProductImage
                  imagemUrl={img}
                  alt={`Miniatura ${index + 1}`}
                  cor={cor}
                  categoria={categoria}
                  className={styles.thumbnailImage}
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
