import { useState } from "react";
import Field from "@/components/ui/Field/Field";
import Checkbox from "@/components/ui/Checkbox/Checkbox";
import Button from "@/components/ui/Button/Button";
import { validarEndereco } from "./enderecoValidation";
import styles from "./PerfilEnderecoForm.module.css";

const CAMPOS_FORMULARIO = [
  { id: "apelido", label: "Apelido do endereço", placeholder: "Ex: Casa, Trabalho", col: styles.colFull, req: true },
  { id: "cep", label: "CEP", placeholder: "00000-000", col: styles.colHalf, req: true },
  { id: "logradouro", label: "Logradouro (Rua, Av.)", placeholder: "Nome da rua ou avenida", col: styles.colFull, req: true },
  { id: "numero", label: "Número", placeholder: "123", col: styles.colHalf, req: true },
  { id: "complemento", label: "Complemento (opcional)", placeholder: "Apto 45, Bloco B", col: styles.colHalf, req: false },
  { id: "bairro", label: "Bairro", placeholder: "Bairro", col: styles.colFull, req: true },
  { id: "cidade", label: "Cidade", placeholder: "Cidade", col: styles.colThreeQuarters, req: true },
  { id: "uf", label: "UF", placeholder: "SP", max: 2, col: styles.colQuarter, req: true },
];

/**
 * Formulário para cadastrar ou editar endereço de entrega.
 */
export default function PerfilEnderecoForm({
  enderecoInicial = null,
  onSalvar,
  onCancelar,
}) {
  const [dados, setDados] = useState({
    apelido: enderecoInicial?.apelido || "",
    cep: enderecoInicial?.cep || "",
    logradouro: enderecoInicial?.logradouro || "",
    numero: enderecoInicial?.numero || "",
    complemento: enderecoInicial?.complemento || "",
    bairro: enderecoInicial?.bairro || "",
    cidade: enderecoInicial?.cidade || "",
    uf: enderecoInicial?.uf || "",
    padrao: Boolean(enderecoInicial?.padrao),
  });

  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);

  const ehEdicao = Boolean(enderecoInicial?.id);

  function atualizarCampo(campo, valor) {
    setDados((prev) => ({ ...prev, [campo]: valor }));
    if (erros[campo]) {
      setErros((prev) => ({ ...prev, [campo]: undefined }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErroEnvio(null);

    const errosValidacao = validarEndereco(dados);
    if (Object.keys(errosValidacao).length > 0) {
      setErros(errosValidacao);
      return;
    }

    setErros({});
    setSalvando(true);

    try {
      if (typeof onSalvar === "function") {
        await onSalvar({
          ...dados,
          id: enderecoInicial?.id,
          uf: dados.uf.trim().toUpperCase(),
        });
      }
    } catch (err) {
      setErroEnvio(
        err?.message || "Não foi possível salvar o endereço. Tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.formCard}>
      <header className={styles.header}>
        <h3 className={styles.title}>
          {ehEdicao ? "Editar endereço" : "Novo endereço"}
        </h3>
        <p className={styles.subtitle}>
          Preencha os dados do local de entrega.
        </p>
      </header>

      {erroEnvio ? (
        <div className={styles.alertError} role="alert">
          {erroEnvio}
        </div>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.grid}>
          {CAMPOS_FORMULARIO.map((c) => (
            <Field
              key={c.id}
              id={`endereco-${c.id}`}
              label={c.label}
              placeholder={c.placeholder}
              maxLength={c.max}
              value={dados[c.id]}
              onChange={(e) => atualizarCampo(c.id, e.target.value)}
              erro={erros[c.id]}
              disabled={salvando}
              className={c.col}
              required={c.req}
            />
          ))}
        </div>

        <div className={styles.checkboxWrapper}>
          <Checkbox
            id="endereco-padrao"
            label="Definir como endereço padrão para entregas"
            checked={dados.padrao}
            onChange={(e) => atualizarCampo("padrao", e.target.checked)}
            disabled={salvando}
          />
        </div>

        <div className={styles.actions}>
          <Button
            type="submit"
            variant="primary"
            disabled={salvando}
            className={styles.submitBtn}
          >
            {salvando ? "Salvando endereço..." : "Salvar endereço"}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onCancelar}
            disabled={salvando}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
