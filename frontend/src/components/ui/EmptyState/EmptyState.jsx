import { useNavigate } from "react-router-dom";
import { PackageOpen } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import styles from "./EmptyState.module.css";

/**
 * EmptyState conforme docs/DESIGN.md:
 * Cartão --color-surface, título, frase curta e botão.
 * Mantém a mesma API e props ({ titulo, mensagem, textoAcao, onAcao, para, icone, className }).
 */
export default function EmptyState({
  titulo,
  mensagem,
  textoAcao,
  onAcao,
  para,
  icone: Icone = PackageOpen,
  className = "",
}) {
  const navigate = useNavigate();

  const handleAcao = () => {
    if (onAcao) {
      onAcao();
    } else if (para) {
      navigate(para);
    }
  };

  const temAcao = Boolean(textoAcao && (onAcao || para));

  return (
    <div className={`${styles.card} ${className}`.trim()}>
      {Icone ? (
        <div className={styles.iconContainer}>
          <Icone
            className={styles.icon}
            size={36}
            strokeWidth={1.8}
            aria-hidden="true"
          />
        </div>
      ) : null}

      {titulo ? <h3 className={styles.titulo}>{titulo}</h3> : null}
      {mensagem ? <p className={styles.mensagem}>{mensagem}</p> : null}

      {temAcao ? (
        <Button
          variant="primary"
          size="sm"
          className={styles.actionButton}
          onClick={handleAcao}
        >
          {textoAcao}
        </Button>
      ) : null}
    </div>
  );
}
