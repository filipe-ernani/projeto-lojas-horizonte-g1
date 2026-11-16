import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button/Button";
import LoginBanner from "./LoginBanner";
import LoginHeader from "./LoginHeader";
import LoginPasswordField from "./LoginPasswordField";
import LoginSocial from "./LoginSocial";
import LoginFooter from "./LoginFooter";
import { useLoginForm } from "./useLoginForm";
import { CONFIG_MODOS, MODOS } from "./loginConstants";
import styles from "./Login.module.css";

/**
 * Página de Autenticação (/login) conforme docs/DESIGN.md e regras D-01/D-03.
 * Estrutura modularizada com separação de responsabilidades para conformidade com SonarQube.
 */
export default function Login() {
  const { usuario, carregando: authCarregando } = useAuth();
  const form = useLoginForm();

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
    return <Navigate to="/" replace />;
  }

  const { modo, enviando, erros } = form;
  const configModo = CONFIG_MODOS[modo];
  const ehCadastro = modo === MODOS.CADASTRAR;
  const ehRecuperacao = modo === MODOS.RECUPERAR;
  const botaoTexto = enviando ? configModo.botaoCarregando : configModo.botaoSubmit;

  return (
    <main className={styles.page}>
      <LoginBanner />

      <section
        className={styles.formSection}
        aria-labelledby="titulo-tela-login"
      >
        <div className={styles.formCard}>
          <LoginHeader modo={modo} />

          {form.erroGeral && (
            <div
              className={styles.alertError}
              role="alert"
              aria-live="assertive"
            >
              {form.erroGeral}
            </div>
          )}

          {form.sucessoRecuperacao && (
            <div
              className={styles.alertSuccess}
              role="status"
              aria-live="polite"
            >
              {form.sucessoRecuperacao}
            </div>
          )}

          <form
            className={styles.form}
            onSubmit={form.handleSubmit}
            noValidate
            aria-label={configModo.ariaLabelForm}
          >
            {ehCadastro && (
              <div className={styles.fieldGroup}>
                <label htmlFor="login-nome" className={styles.label}>
                  Nome completo{" "}
                  <span className={styles.optional}>(opcional)</span>
                </label>
                <input
                  id="login-nome"
                  type="text"
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={form.nome}
                  onChange={(e) => form.setNome(e.target.value)}
                  disabled={enviando}
                  className={styles.input}
                />
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label htmlFor="login-email" className={styles.label}>
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={(e) => {
                  form.setEmail(e.target.value);
                  form.limparErroCampo("email");
                }}
                disabled={enviando}
                aria-invalid={Boolean(erros.email)}
                aria-describedby={erros.email ? "erro-login-email" : undefined}
                className={`${styles.input} ${erros.email ? styles.inputError : ""}`.trim()}
              />
              {erros.email && (
                <span
                  id="erro-login-email"
                  className={styles.fieldError}
                  role="alert"
                >
                  {erros.email}
                </span>
              )}
            </div>

            {!ehRecuperacao && (
              <LoginPasswordField
                id="login-senha"
                label="Senha"
                value={form.senha}
                onChange={(e) => {
                  form.setSenha(e.target.value);
                  form.limparErroCampo("senha");
                }}
                placeholder={ehCadastro ? "Mínimo de 6 caracteres" : "Sua senha"}
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
            )}

            {ehCadastro && (
              <LoginPasswordField
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
            )}

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

          {!ehRecuperacao && (
            <LoginSocial
              disabled={enviando}
              onLoginGoogle={form.handleLoginGoogle}
            />
          )}

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
