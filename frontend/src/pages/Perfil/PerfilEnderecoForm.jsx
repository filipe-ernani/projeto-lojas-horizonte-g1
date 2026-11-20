import { useRef, useState } from "react";
import Field from "@/components/ui/Field/Field";
import Select from "@/components/ui/Select/Select";
import Checkbox from "@/components/ui/Checkbox/Checkbox";
import Button from "@/components/ui/Button/Button";
import useCep from "@/hooks/useCep";
import { OPCOES_UF } from "@/constants/ufs";
import { extrairDigitos, mascararCep } from "@/utils/mascaras";
import {
  LIMITES_ENDERECO,
  validarCampoEndereco,
  validarEndereco,
} from "./enderecoValidation";
import styles from "./PerfilEnderecoForm.module.css";

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
    cep: mascararCep(enderecoInicial?.cep || ""),
    logradouro: enderecoInicial?.logradouro || "",
    numero: enderecoInicial?.numero || "",
    complemento: enderecoInicial?.complemento || "",
    bairro: enderecoInicial?.bairro || "",
    cidade: enderecoInicial?.cidade || "",
    uf: (enderecoInicial?.uf || "").toUpperCase(),
    padrao: Boolean(enderecoInicial?.padrao),
  });

  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const numeroRef = useRef(null);

  const { buscando, erroCep, buscarCep, limparErroCep } = useCep();

  const ehEdicao = Boolean(enderecoInicial?.id);
  const cepDigitos = extrairDigitos(dados.cep);

  function atualizarCampo(campo, valor) {
    setDados((prev) => ({ ...prev, [campo]: valor }));
    if (erros[campo]) {
      setErros((prev) => ({ ...prev, [campo]: undefined }));
    }
    if (campo === "cep" && erroCep) {
      limparErroCep();
    }
  }

  function validarAoSair(campo) {
    const msg = validarCampoEndereco(campo, dados[campo]);
    setErros((prev) => ({ ...prev, [campo]: msg }));
  }

  async function handleBuscarCep() {
    if (buscando || cepDigitos.length !== 8) {
      return;
    }

    const resultado = await buscarCep(cepDigitos);
    if (resultado?.ok && resultado.dados) {
      const { logradouro, bairro, cidade, uf } = resultado.dados;
      setDados((prev) => ({
        ...prev,
        logradouro: logradouro || prev.logradouro,
        bairro: bairro || prev.bairro,
        cidade: cidade || prev.cidade,
        uf: uf || prev.uf,
      }));
      setErros((prev) => ({
        ...prev,
        cep: undefined,
        logradouro: undefined,
        bairro: undefined,
        cidade: undefined,
        uf: undefined,
      }));
      numeroRef.current?.focus();
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
          apelido: dados.apelido.trim(),
          cep: cepDigitos,
          logradouro: dados.logradouro.trim(),
          numero: dados.numero.trim().toUpperCase(),
          complemento: dados.complemento.trim(),
          bairro: dados.bairro.trim(),
          cidade: dados.cidade.trim(),
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
          <Field
            id="endereco-apelido"
            label="Apelido do endereço"
            placeholder="Ex: Casa, Trabalho"
            maxLength={LIMITES_ENDERECO.apelido}
            value={dados.apelido}
            onChange={(e) => atualizarCampo("apelido", e.target.value)}
            onBlur={() => validarAoSair("apelido")}
            erro={erros.apelido}
            disabled={salvando}
            className={styles.colFull}
            required
          />

          <div className={`${styles.cepRow} ${styles.colFull}`}>
            <Field
              id="endereco-cep"
              label="CEP"
              placeholder="00000-000"
              inputMode="numeric"
              maxLength={9}
              value={dados.cep}
              onChange={(e) => atualizarCampo("cep", mascararCep(e.target.value))}
              onBlur={() => validarAoSair("cep")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleBuscarCep();
                }
              }}
              erro={erros.cep || erroCep}
              disabled={salvando}
              className={styles.cepField}
              required
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleBuscarCep}
              disabled={salvando || buscando || cepDigitos.length !== 8}
              className={styles.cepButton}
            >
              {buscando ? "Buscando..." : "Buscar CEP"}
            </Button>
          </div>

          <Field
            id="endereco-logradouro"
            label="Logradouro (Rua, Av.)"
            placeholder="Nome da rua ou avenida"
            maxLength={LIMITES_ENDERECO.logradouro}
            value={dados.logradouro}
            onChange={(e) => atualizarCampo("logradouro", e.target.value)}
            onBlur={() => validarAoSair("logradouro")}
            erro={erros.logradouro}
            disabled={salvando}
            className={styles.colFull}
            required
          />

          <Field
            ref={numeroRef}
            id="endereco-numero"
            label="Número"
            placeholder="123, 123A ou S/N"
            maxLength={LIMITES_ENDERECO.numero}
            value={dados.numero}
            onChange={(e) =>
              atualizarCampo("numero", e.target.value.toUpperCase())
            }
            onBlur={() => validarAoSair("numero")}
            erro={erros.numero}
            disabled={salvando}
            className={styles.colHalf}
            required
          />

          <Field
            id="endereco-complemento"
            label="Complemento (opcional)"
            placeholder="Apto 45, Bloco B"
            maxLength={LIMITES_ENDERECO.complemento}
            value={dados.complemento}
            onChange={(e) => atualizarCampo("complemento", e.target.value)}
            onBlur={() => validarAoSair("complemento")}
            erro={erros.complemento}
            disabled={salvando}
            className={styles.colHalf}
          />

          <Field
            id="endereco-bairro"
            label="Bairro"
            placeholder="Bairro"
            maxLength={LIMITES_ENDERECO.bairro}
            value={dados.bairro}
            onChange={(e) => atualizarCampo("bairro", e.target.value)}
            onBlur={() => validarAoSair("bairro")}
            erro={erros.bairro}
            disabled={salvando}
            className={styles.colFull}
            required
          />

          <Field
            id="endereco-cidade"
            label="Cidade"
            placeholder="Cidade"
            maxLength={LIMITES_ENDERECO.cidade}
            value={dados.cidade}
            onChange={(e) => atualizarCampo("cidade", e.target.value)}
            onBlur={() => validarAoSair("cidade")}
            erro={erros.cidade}
            disabled={salvando}
            className={styles.colThreeQuarters}
            required
          />

          <Select
            id="endereco-uf"
            label="UF"
            value={dados.uf}
            onChange={(e) => atualizarCampo("uf", e.target.value)}
            onBlur={() => validarAoSair("uf")}
            options={OPCOES_UF}
            erro={erros.uf}
            desabilitado={salvando}
            className={styles.colQuarter}
            required
          />
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
