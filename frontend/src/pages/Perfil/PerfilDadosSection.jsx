import { useState } from "react";
import Field from "@/components/ui/Field/Field";
import Button from "@/components/ui/Button/Button";
import styles from "./PerfilDadosSection.module.css";

/**
 * Seção de dados pessoais do usuário (/perfil):
 * - Nome e telefone editáveis.
 * - E-mail somente leitura (Field readOnly).
 * - Validação simples (nome obrigatório).
 * - Mensagens de sucesso e erro após salvar.
 */
export default function PerfilDadosSection({
  perfil = { nome: "", email: "", telefone: "" },
  onSalvarPerfil,
}) {
  const [nome, setNome] = useState(perfil?.nome || "");
  const [telefone, setTelefone] = useState(perfil?.telefone || "");
  const [erroNome, setErroNome] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [mensagemErro, setMensagemErro] = useState(null);
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMensagemSucesso(null);
    setMensagemErro(null);

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      setErroNome("Informe seu nome completo.");
      return;
    }

    setErroNome(null);
    setSalvando(true);

    try {
      if (typeof onSalvarPerfil === "function") {
        await onSalvarPerfil({
          nome: nomeLimpo,
          telefone: telefone.trim(),
        });
      }
      setMensagemSucesso("Dados atualizados com sucesso!");
    } catch (err) {
      setMensagemErro(
        err?.message || "Não foi possível salvar os dados. Tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className={styles.section} aria-labelledby="meus-dados-title">
      <div className={styles.header}>
        <h2 id="meus-dados-title" className={styles.title}>
          Meus dados
        </h2>
        <p className={styles.subtitle}>
          Mantenha suas informações pessoais e de contato atualizadas.
        </p>
      </div>

      {mensagemSucesso ? (
        <div className={styles.alertSuccess} role="status" aria-live="polite">
          {mensagemSucesso}
        </div>
      ) : null}

      {mensagemErro ? (
        <div className={styles.alertError} role="alert" aria-live="assertive">
          {mensagemErro}
        </div>
      ) : null}

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field
          id="perfil-nome"
          label="Nome completo"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (erroNome) setErroNome(null);
          }}
          erro={erroNome}
          placeholder="Seu nome completo"
          disabled={salvando}
          required
        />

        <Field
          id="perfil-email"
          label="E-mail"
          type="email"
          value={perfil?.email || ""}
          readOnly
          ajuda="O endereço de e-mail é vinculado à sua conta e não pode ser editado."
        />

        <Field
          id="perfil-telefone"
          label="Telefone"
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(11) 99999-9999"
          disabled={salvando}
        />

        <div className={styles.formActions}>
          <Button
            type="submit"
            variant="primary"
            disabled={salvando}
            className={styles.submitBtn}
          >
            {salvando ? "Salvando alterações..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </section>
  );
}
