import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Field from "@/components/ui/Field/Field";
import Button from "@/components/ui/Button/Button";
import { extrairDigitos, mascararTelefone } from "@/utils/mascaras";
import { validarTelefonePerfil } from "./enderecoValidation";
import styles from "./PerfilDadosSection.module.css";

/**
 * Seção de dados pessoais do usuário (/perfil):
 * - Nome e telefone editáveis.
 * - E-mail desativado (disabled + readOnly) com placeholder do usuário.
 * - Placeholders de nome e telefone atualizados dinamicamente após salvar.
 * - Validação simples (nome obrigatório).
 * - Mensagens de sucesso e erro após salvar.
 */
export default function PerfilDadosSection({
  perfil,
  salvandoPerfil = false,
  onSalvarPerfil,
}) {
  const { usuario } = useAuth();

  const emailUsuario = perfil?.email || usuario?.email || "";
  const nomeInicial = perfil?.nome || usuario?.displayName || "";
  const telefoneInicial = perfil?.telefone || usuario?.phoneNumber || "";

  const [nome, setNome] = useState(nomeInicial);
  const [telefone, setTelefone] = useState(mascararTelefone(telefoneInicial));
  const [placeholderNome, setPlaceholderNome] = useState(
    nomeInicial || "Seu nome completo",
  );
  const [placeholderTelefone, setPlaceholderTelefone] = useState(
    mascararTelefone(telefoneInicial) || "(11) 99999-9999",
  );
  const [erroNome, setErroNome] = useState(null);
  const [erroTelefone, setErroTelefone] = useState(null);
  const [mensagemSucesso, setMensagemSucesso] = useState(null);
  const [mensagemErro, setMensagemErro] = useState(null);
  const [salvandoLocal, setSalvandoLocal] = useState(false);
  const salvando = salvandoLocal || salvandoPerfil;

  // Dados novos da API entram no formulário sem remontar a seção (preserva as mensagens)
  const dadosRecebidos = `${nomeInicial}|${telefoneInicial}`;
  const [dadosAplicados, setDadosAplicados] = useState(dadosRecebidos);
  if (dadosRecebidos !== dadosAplicados) {
    setDadosAplicados(dadosRecebidos);
    setNome(nomeInicial);
    setTelefone(mascararTelefone(telefoneInicial));
    setPlaceholderNome(nomeInicial || "Seu nome completo");
    setPlaceholderTelefone(
      mascararTelefone(telefoneInicial) || "(11) 99999-9999",
    );
  }

  function validarNomeAoSair() {
    const limpo = nome.trim();
    if (!limpo) {
      setErroNome("Informe seu nome completo.");
    } else if (limpo.length > 100) {
      setErroNome("O nome deve ter no máximo 100 caracteres.");
    }
  }

  function validarTelefoneAoSair() {
    setErroTelefone(validarTelefonePerfil(telefone) || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensagemSucesso(null);
    setMensagemErro(null);

    const nomeLimpo = nome.trim();
    const erroTel = validarTelefonePerfil(telefone);

    let temErro = false;
    if (!nomeLimpo) {
      setErroNome("Informe seu nome completo.");
      temErro = true;
    } else if (nomeLimpo.length > 100) {
      setErroNome("O nome deve ter no máximo 100 caracteres.");
      temErro = true;
    } else {
      setErroNome(null);
    }

    if (erroTel) {
      setErroTelefone(erroTel);
      temErro = true;
    } else {
      setErroTelefone(null);
    }

    if (temErro) {
      return;
    }

    setSalvandoLocal(true);

    try {
      const telefoneDigitos = extrairDigitos(telefone);
      if (typeof onSalvarPerfil === "function") {
        await onSalvarPerfil({
          nome: nomeLimpo,
          telefone: telefoneDigitos,
        });
      }

      // Atualiza os placeholders com os dados salvos
      setPlaceholderNome(nomeLimpo);
      if (telefoneDigitos) {
        setPlaceholderTelefone(mascararTelefone(telefoneDigitos));
      }

      setMensagemSucesso("Dados atualizados com sucesso!");
    } catch (err) {
      setMensagemErro(
        err?.message || "Não foi possível salvar os dados. Tente novamente.",
      );
    } finally {
      setSalvandoLocal(false);
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
          maxLength={100}
          onChange={(e) => {
            setNome(e.target.value);
            if (erroNome) setErroNome(null);
          }}
          onBlur={validarNomeAoSair}
          erro={erroNome}
          placeholder={placeholderNome}
          disabled={salvando}
          required
        />

        <Field
          id="perfil-email"
          label="E-mail"
          type="email"
          value={emailUsuario}
          placeholder={emailUsuario || "seu@email.com"}
          disabled
          readOnly
          ajuda="O endereço de e-mail é vinculado à sua conta e não pode ser editado."
        />

        <Field
          id="perfil-telefone"
          label="Telefone"
          type="tel"
          inputMode="numeric"
          maxLength={15}
          value={telefone}
          onChange={(e) => {
            setTelefone(mascararTelefone(e.target.value));
            if (erroTelefone) setErroTelefone(null);
          }}
          onBlur={validarTelefoneAoSair}
          erro={erroTelefone}
          placeholder={placeholderTelefone}
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
