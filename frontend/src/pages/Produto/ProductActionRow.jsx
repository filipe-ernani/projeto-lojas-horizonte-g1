import { Heart } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import IconButton from "@/components/ui/IconButton/IconButton";
import styles from "./Produto.module.css";

/**
 * Linha de ações da página de Produto:
 * - Botão "Adicionar à cesta" (desabilitado enquanto faltar escolha necessária).
 * - Botão de favoritar (IconButton com Heart).
 */
export default function ProductActionRow({
  podeAdicionar,
  onAdicionar,
  favorito,
  onToggleFavorito,
}) {
  return (
    <div className={styles.actionRow}>
      <Button
        variant="primary"
        size="lg"
        fullWidth
        disabled={!podeAdicionar}
        onClick={onAdicionar}
      >
        Adicionar à cesta
      </Button>

      <IconButton
        icone={Heart}
        rotulo={
          favorito
            ? "Remover produto dos favoritos"
            : "Adicionar produto aos favoritos"
        }
        ativo={favorito}
        tamanho={52}
        onClick={onToggleFavorito}
      />
    </div>
  );
}
