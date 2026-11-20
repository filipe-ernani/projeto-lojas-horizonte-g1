import { Navigate, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button/Button";
import Field from "@/components/ui/Field/Field";
import LoginBanner from "./LoginBanner";
import LoginHeader from "./LoginHeader";
import PasswordField from "./PasswordField";
import LoginSocial from "./LoginSocial";
import LoginFooter from "./LoginFooter";
import LoginFeedback from "./LoginFeedback";
import { useLoginForm } from "./useLoginForm";
import {
  CONFIG_MODOS,
  MODOS,
  obterDestinoRedirecionamento,
} from "./loginConstants";
import styles from "./Login.module.css";

/**
 * Página de Autenticação (/login) conforme docs/DESIGN.md e regras D-01/D-03:
 * - 3 modos (entrar, cadastrar, recuperar) via parâmetro URL modo ou abas.
 * - Utiliza o componente base Field de ui/ para nome e e-mail.
 * - Utiliza o PasswordField local para campos de senha com alternância de visibilidade.
 * - Redirecionamento e autenticação desacoplados no useLoginForm.
 */
export default function Login() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const modoQuery = searchParams.get("modo");
  const modoInicial = [MODOS.ENTRAR, MODOS.CADASTRAR, MODOS.RECUPERAR].includes(
    modoQuery,
  )
    ? modoQuery
    : MODOS.ENTRAR;

  const { usuario, carregando: authCarregando } = useAuth();
  const form = useLoginForm(modoInicial);

  if (authCarregando) {
    return (
      <main
        className={styles.loadingWrapper}
        aria-busy="true"
        aria-label="Verificando sessão"
      >
        <div className={styles.loadingSkeleton} />
      </main>
    );
  }

  if (usuario) {
    const destino = obterDestinoRedirecionamento(location.state?.from);
    return <Navigate to={destino} replace />;
  }

  const { modo, enviando, erros } = form;
  const configModo = CONFIG_MODOS[modo];
  const ehCadastro = modo === MODOS.CADASTRAR;
  const ehRecuperacao = modo === MODOS.RECUPERAR;
  const botaoTexto = enviando
    ? configModo.botaoCarregando
    : configModo.botaoSubmit;

  return (
    <main className={styles.page}>
      <LoginBanner />

      <section
        className={styles.formSection}
        aria-labelledby="titulo-tela-login"
      >
        <div className={styles.formCard}>
          <LoginHeader modo={modo} />

          <LoginFeedback
            erro={form.erroGeral}
            sucesso={form.sucessoRecuperacao}
          />

          <form
            className={styles.form}
            onSubmit={form.handleSubmit}
            noValidate
            aria-label={configModo.ariaLabelForm}
          >
            {ehCadastro ? (
              <Field
                id="login-nome"
                label={
                  <>
                    Nome completo{" "}
                    <span className={styles.optional}>(opcional)</span>
                  </>
                }
                type="text"
                autoComplete="name"
                placeholder="Seu nome"
                value={form.nome}
                onChange={(e) => form.setNome(e.target.value)}
                disabled={enviando}
              />
            ) : null}

            <Field
              id="login-email"
              label="E-mail"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => {
                form.setEmail(e.target.value);
                form.limparErroCampo("email");
              }}
              erro={erros.email}
              disabled={enviando}
              required
            />

            {!ehRecuperacao ? (
              <PasswordField
                id="login-senha"
                label="Senha"
                value={form.senha}
                onChange={(e) => {
                  form.setSenha(e.target.value);
                  form.limparErroCampo("senha");
                }}
                placeholder={
                  ehCadastro ? "Mínimo de 6 caracteres" : "Sua senha"
                }
                autoComplete={ehCadastro ? "new-password" : "current-password"}
                error={erros.senha}
                errorId="erro-login-senha"
                disabled={enviando}
                mostrarSenha={form.mostrarSenha}
                onToggleMostrar={() => form.setMostrarSenha((prev) => !prev)}
                extraAction={
                  modo === MODOS.ENTRAR ? (
                    <button
                      type="button"
                      className={styles.inlineAction}
                      onClick={() => form.mudarModo(MODOS.RECUPERAR)}
                      disabled={enviando}
                    >
                      Esqueceu sua senha?
                    </button>
                  ) : null
                }
              />
            ) : null}

            {ehCadastro ? (
              <PasswordField
                id="login-confirmacao"
                label="Confirmar senha"
                value={form.confirmacaoSenha}
                onChange={(e) => {
                  form.setConfirmacaoSenha(e.target.value);
                  form.limparErroCampo("confirmacaoSenha");
                }}
                placeholder="Repita sua senha"
                autoComplete="new-password"
                error={erros.confirmacaoSenha}
                errorId="erro-login-confirmacao"
                disabled={enviando}
                mostrarSenha={form.mostrarConfirmacaoSenha}
                onToggleMostrar={() =>
                  form.setMostrarConfirmacaoSenha((prev) => !prev)
                }
              />
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={enviando}
              className={styles.submitBtn}
            >
              {botaoTexto}
            </Button>
          </form>

          {!ehRecuperacao ? (
            <LoginSocial
              disabled={enviando}
              onLoginGoogle={form.handleLoginGoogle}
            />
          ) : null}

          <LoginFooter
            modo={modo}
            disabled={enviando}
            onMudarModo={form.mudarModo}
          />
        </div>
      </section>
    </main>
  );
}
