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
  adicionando = false,
  feedbackAdicao = "",
}) {
  const textoBotao = adicionando
    ? "Adicionando..."
    : feedbackAdicao
      ? feedbackAdicao
      : "Adicionar à cesta";

  return (
    <div className={styles.actionRowContainer}>
      <div className={styles.actionRow}>
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={!podeAdicionar || adicionando}
          onClick={onAdicionar}
          aria-live="polite"
        >
          {textoBotao}
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
      {feedbackAdicao ? (
        <p className={styles.feedbackToast} role="status" aria-live="polite">
          {feedbackAdicao}
        </p>
      ) : null}
    </div>
  );
}
