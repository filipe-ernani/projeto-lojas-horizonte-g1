import Radio from "@/components/ui/Radio/Radio";
import Badge from "@/components/ui/Badge/Badge";
import styles from "./AddressOption.module.css";

/**
 * AddressOption conforme docs/DESIGN.md:
 * Card de endereço para seleção no Checkout com Radio, apelido, Badge 'Padrão' e linhas de endereço.
 */
export default function AddressOption({
  endereco,
  selecionado = false,
  onSelecionar,
  name = "enderecoEntrega",
}) {
  if (!endereco) {
    return null;
  }

  const {
    id,
    apelido,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    uf,
    cep,
    padrao,
  } = endereco;

  return (
    <div
      className={`${styles.card} ${selecionado ? styles.selected : ""}`}
      onClick={() => onSelecionar?.(id)}
    >
      <Radio
        name={name}
        value={String(id)}
        checked={selecionado}
        onChange={() => onSelecionar?.(id)}
        className={styles.radioWrapper}
      >
        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.apelido}>{apelido}</span>
            {padrao ? <Badge variante="escuro">Padrão</Badge> : null}
          </div>
          <p className={styles.enderecoLinha}>
            {logradouro}, {numero} {complemento ? `· ${complemento}` : ""}
          </p>
          <p className={styles.cidadeLinha}>
            {bairro} — {cidade}/{uf} · CEP {cep}
          </p>
        </div>
      </Radio>
    </div>
  );
}
