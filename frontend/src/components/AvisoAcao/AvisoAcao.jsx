import { X } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import styles from "./AvisoAcao.module.css";

/**
 * Aviso curto com o resultado de uma ação do usuário (erro ou sucesso).
 * Pode oferecer uma ação ("Tentar de novo") e um botão para fechar.
 */
export default function AvisoAcao({
  mensagem,
  tipo = "erro",
  textoAcao,
  onAcao,
  onFechar,
}) {
  if (!mensagem) {
    return null;
  }

  const ehErro = tipo === "erro";

  return (
    <div
      className={`${styles.aviso} ${ehErro ? styles.erro : styles.sucesso}`}
      role={ehErro ? "alert" : "status"}
    >
      <p className={styles.mensagem}>{mensagem}</p>

      {textoAcao && onAcao ? (
        <Button variant="outline" size="sm" onClick={onAcao}>
          {textoAcao}
        </Button>
      ) : null}

      {onFechar ? (
        <button
          type="button"
          className={styles.fechar}
          onClick={onFechar}
          aria-label="Fechar aviso"
        >
          <X size={18} strokeWidth={1.8} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
