import { useState } from "react";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import styles from "./AddressCard.module.css";

/**
 * AddressCard conforme docs/DESIGN.md:
 * Exibe apelido, selo "Padrão" (Badge), linhas de endereço formatadas e ações Editar/Excluir.
 * Inclui confirmação inline antes de excluir o endereço.
 */
export default function AddressCard({
  endereco,
  onEditar,
  onExcluir,
  onDefinirPadrao,
  className = "",
}) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  if (!endereco) {
    return null;
  }

  const {
    id,
    apelido = "Endereço",
    cep = "",
    logradouro = "",
    numero = "",
    complemento = "",
    bairro = "",
    cidade = "",
    uf = "",
    padrao = false,
  } = endereco;

  function handleConfirmarExclusao() {
    setConfirmandoExclusao(false);
    if (typeof onExcluir === "function") {
      onExcluir(id);
    }
  }

  return (
    <article className={`${styles.card} ${className}`.trim()}>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <h3 className={styles.apelido}>{apelido}</h3>
          {padrao ? <Badge variante="ok">Padrão</Badge> : null}
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.line}>
          {logradouro}
          {numero ? `, ${numero}` : ""}
          {complemento ? ` — ${complemento}` : ""}
        </p>
        <p className={styles.line}>
          {bairro}
          {cidade ? ` · ${cidade}` : ""}
          {uf ? `/${uf}` : ""}
        </p>
        {cep ? <p className={styles.cep}>CEP {cep}</p> : null}
      </div>

      {confirmandoExclusao ? (
        <div className={styles.confirmBox} role="alert">
          <p className={styles.confirmText}>Excluir este endereço?</p>
          <div className={styles.confirmActions}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleConfirmarExclusao}
              className={styles.deleteConfirmBtn}
            >
              Sim, excluir
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmandoExclusao(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.actions}>
          {!padrao && onDefinirPadrao ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDefinirPadrao(id, endereco)}
              aria-label={`Tornar ${apelido} o endereço padrão`}
            >
              Tornar padrão
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditar?.(endereco)}
            aria-label={`Editar endereço ${apelido}`}
          >
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmandoExclusao(true)}
            aria-label={`Excluir endereço ${apelido}`}
          >
            Excluir
          </Button>
        </div>
      )}
    </article>
  );
}
