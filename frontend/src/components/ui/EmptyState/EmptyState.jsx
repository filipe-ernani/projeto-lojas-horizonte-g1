import { Link } from "react-router-dom";
import { PackageOpen } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import styles from "./EmptyState.module.css";

/**
 * EmptyState conforme docs/DESIGN.md:
 * Cartão --color-surface, título, frase curta e botão.
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
  return (
    <div className={`${styles.card} ${className}`.trim()}>
      {Icone ? (
        <div className={styles.iconContainer}>
          <Icone className={styles.icon} size={36} strokeWidth={1.8} />
        </div>
      ) : null}

      {titulo ? <h3 className={styles.titulo}>{titulo}</h3> : null}
      {mensagem ? <p className={styles.mensagem}>{mensagem}</p> : null}

      {textoAcao && para ? (
        <Link to={para} className={styles.actionLink}>
          <Button variant="primary" size="sm">
            {textoAcao}
          </Button>
        </Link>
      ) : null}

      {textoAcao && onAcao && !para ? (
        <Button variant="primary" size="sm" onClick={onAcao}>
          {textoAcao}
        </Button>
      ) : null}
    </div>
  );
}
