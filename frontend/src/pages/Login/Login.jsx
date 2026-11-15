import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button/Button";
import GoogleIcon from "./GoogleIcon";
import LoginBanner from "./LoginBanner";
import { CONFIG_MODOS, MODOS } from "./loginConstants";
import { validarCamposAuth } from "./loginValidation";
import styles from "./Login.module.css";

export default function Login() {
  const {
    usuario,
    carregando: authCarregando,
    loginEmailSenha,
    loginGoogle,
    cadastrar,
    recuperarSenha,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);

  // Modos da tela: "entrar" | "cadastrar" | "recuperar"
  const [modo, setModo] = useState(MODOS.ENTRAR);

  // Campos do formulário
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");

  // Visibilidade de senhas
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacaoSenha, setMostrarConfirmacaoSenha] = useState(false);

  // Estados de feedback e envio
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState(null);
  const [sucessoRecuperacao, setSucessoRecuperacao] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Redireciona após autenticação bem-sucedida para a rota de origem
  function redirecionarPosLogin() {
    const from = location.state?.from;
    if (!from) {
      navigate("/", { replace: true });
      return;
    }
    if (typeof from === "string") {
      navigate(from, { replace: true });
      return;
    }
    const search = from.search || "";
    const hash = from.hash || "";
    navigate(`${from.pathname || "/"}${search}${hash}`, { replace: true });
  }

  // Alterna o modo da tela limpando mensagens e senhas
  function mudarModo(novoModo) {
    setModo(novoModo);
    setErros({});
    setErroGeral(null);
    setSucessoRecuperacao(null);
    setSenha("");
    setConfirmacaoSenha("");
    setMostrarSenha(false);
    setMostrarConfirmacaoSenha(false);
  }

  // Despacho centralizado das ações de autenticação
  async function executarAcaoModo() {
    const emailLimpo = email.trim();

    if (modo === MODOS.ENTRAR) {
      await loginEmailSenha(emailLimpo, senha);
      redirecionarPosLogin();
      return;
    }

    if (modo === MODOS.CADASTRAR) {
      await cadastrar(emailLimpo, senha, nome.trim() || undefined);
      redirecionarPosLogin();
      return;
    }

    if (modo === MODOS.RECUPERAR) {
      await recuperarSenha(emailLimpo);
      if (isMountedRef.current) {
        setSucessoRecuperacao(
          "Link de redefinição enviado com sucesso! Verifique a caixa de entrada e a pasta de spam do seu e-mail.",
        );
      }
    }
  }

  // Submissão do formulário principal
  async function handleSubmit(e) {
    e.preventDefault();
    setErroGeral(null);
    setSucessoRecuperacao(null);

    const validacaoErros = validarCamposAuth({
      modo,
      email,
      senha,
      confirmacaoSenha,
    });

    if (Object.keys(validacaoErros).length > 0) {
      setErros(validacaoErros);
      return;
    }

    setErros({});
    setEnviando(true);
    try {
      await executarAcaoModo();
    } catch (erro) {
      if (isMountedRef.current) {
        setErroGeral(
          erro.message || "Não foi possível concluir a ação. Tente novamente.",
        );
      }
    } finally {
      if (isMountedRef.current) {
        setEnviando(false);
      }
    }
  }

  // Autenticação com provedor Google
  async function handleLoginGoogle() {
    setErroGeral(null);
    setSucessoRecuperacao(null);
    setEnviando(true);

    try {
      await loginGoogle();
      redirecionarPosLogin();
    } catch (erro) {
      if (isMountedRef.current) {
        setErroGeral(
          erro.message || "Não foi possível entrar com o Google. Tente novamente.",
        );
      }
    } finally {
      if (isMountedRef.current) {
        setEnviando(false);
      }
    }
  }

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

  // Se já estiver logado, redireciona para a raiz
  if (usuario) {
    return <Navigate to="/" replace />;
  }

  const configModo = CONFIG_MODOS[modo];

  return (
    <main className={styles.page}>
      {/* Banner lateral escuro (Desktop) */}
      <LoginBanner />

      {/* Seção principal do formulário (Mobile e Desktop) */}
      <section
        className={styles.formSection}
        aria-labelledby="titulo-tela-login"
      >
        <div className={styles.formCard}>
          {/* Cabeçalho mobile */}
          <header className={styles.formHeaderMobile}>
            <Link to="/" className={styles.mobileLogo}>
              HORIZONTE
            </Link>
            <Link to="/" className={styles.backLink} aria-label="Voltar à loja">
              <ArrowLeft size={18} aria-hidden="true" />
              <span>Voltar ao início</span>
            </Link>
          </header>

          <div className={styles.formHeading}>
            <h1 id="titulo-tela-login" className={styles.title}>
              {configModo.titulo}
            </h1>
            <p className={styles.subtitle}>{configModo.subtitulo}</p>
          </div>

          {/* Mensagem de erro geral do AuthContext */}
          {erroGeral && (
            <div
              className={styles.alertError}
              role="alert"
              aria-live="assertive"
            >
              {erroGeral}
            </div>
          )}

          {/* Mensagem de sucesso ao enviar link de recuperação */}
          {sucessoRecuperacao && (
            <div
              className={styles.alertSuccess}
              role="status"
              aria-live="polite"
            >
              {sucessoRecuperacao}
            </div>
          )}

          <form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
            aria-label={configModo.ariaLabelForm}
          >
            {/* Campo Nome (opcional, apenas no cadastro) */}
            {modo === MODOS.CADASTRAR && (
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
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  disabled={enviando}
                  className={styles.input}
                />
              </div>
            )}

            {/* Campo E-mail */}
            <div className={styles.fieldGroup}>
              <label htmlFor="login-email" className={styles.label}>
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (erros.email) {
                    setErros((prev) => ({ ...prev, email: undefined }));
                  }
                }}
                disabled={enviando}
                aria-invalid={Boolean(erros.email)}
                aria-describedby={erros.email ? "erro-login-email" : undefined}
                className={`${styles.input} ${erros.email ? styles.inputError : ""}`}
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

            {/* Campo Senha (entrar e cadastrar) */}
            {modo !== MODOS.RECUPERAR && (
              <div className={styles.fieldGroup}>
                <div className={styles.labelRow}>
                  <label htmlFor="login-senha" className={styles.label}>
                    Senha
                  </label>
                  {modo === MODOS.ENTRAR && (
                    <button
                      type="button"
                      className={styles.inlineAction}
                      onClick={() => mudarModo(MODOS.RECUPERAR)}
                      disabled={enviando}
                    >
                      Esqueceu sua senha?
                    </button>
                  )}
                </div>
                <div className={styles.passwordWrapper}>
                  <input
                    id="login-senha"
                    type={mostrarSenha ? "text" : "password"}
                    autoComplete={
                      modo === MODOS.ENTRAR
                        ? "current-password"
                        : "new-password"
                    }
                    placeholder={
                      modo === MODOS.CADASTRAR
                        ? "Mínimo de 6 caracteres"
                        : "Sua senha"
                    }
                    value={senha}
                    onChange={(e) => {
                      setSenha(e.target.value);
                      if (erros.senha) {
                        setErros((prev) => ({ ...prev, senha: undefined }));
                      }
                    }}
                    disabled={enviando}
                    aria-invalid={Boolean(erros.senha)}
                    aria-describedby={
                      erros.senha ? "erro-login-senha" : undefined
                    }
                    className={`${styles.input} ${styles.inputWithToggle} ${
                      erros.senha ? styles.inputError : ""
                    }`}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setMostrarSenha((prev) => !prev)}
                    aria-label={
                      mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                    }
                    aria-controls="login-senha"
                    aria-expanded={mostrarSenha}
                    disabled={enviando}
                  >
                    {mostrarSenha ? (
                      <EyeOff size={20} aria-hidden="true" />
                    ) : (
                      <Eye size={20} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {erros.senha && (
                  <span
                    id="erro-login-senha"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {erros.senha}
                  </span>
                )}
              </div>
            )}

            {/* Campo Confirmação de Senha (apenas no cadastro) */}
            {modo === MODOS.CADASTRAR && (
              <div className={styles.fieldGroup}>
                <label htmlFor="login-confirmacao" className={styles.label}>
                  Confirmar senha
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="login-confirmacao"
                    type={mostrarConfirmacaoSenha ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repita sua senha"
                    value={confirmacaoSenha}
                    onChange={(e) => {
                      setConfirmacaoSenha(e.target.value);
                      if (erros.confirmacaoSenha) {
                        setErros((prev) => ({
                          ...prev,
                          confirmacaoSenha: undefined,
                        }));
                      }
                    }}
                    disabled={enviando}
                    aria-invalid={Boolean(erros.confirmacaoSenha)}
                    aria-describedby={
                      erros.confirmacaoSenha
                        ? "erro-login-confirmacao"
                        : undefined
                    }
                    className={`${styles.input} ${styles.inputWithToggle} ${
                      erros.confirmacaoSenha ? styles.inputError : ""
                    }`}
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setMostrarConfirmacaoSenha((prev) => !prev)}
                    aria-label={
                      mostrarConfirmacaoSenha
                        ? "Ocultar confirmação de senha"
                        : "Mostrar confirmação de senha"
                    }
                    aria-controls="login-confirmacao"
                    aria-expanded={mostrarConfirmacaoSenha}
                    disabled={enviando}
                  >
                    {mostrarConfirmacaoSenha ? (
                      <EyeOff size={20} aria-hidden="true" />
                    ) : (
                      <Eye size={20} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {erros.confirmacaoSenha && (
                  <span
                    id="erro-login-confirmacao"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {erros.confirmacaoSenha}
                  </span>
                )}
              </div>
            )}

            {/* Botão de submissão principal */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={enviando}
              className={styles.submitBtn}
            >
              {enviando ? configModo.botaoCarregando : configModo.botaoSubmit}
            </Button>
          </form>

          {/* Autenticação social com Google (Entrar e Cadastrar) */}
          {modo !== MODOS.RECUPERAR && (
            <div className={styles.socialBlock}>
              <div className={styles.divider}>
                <span className={styles.dividerText}>ou</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                fullWidth
                disabled={enviando}
                onClick={handleLoginGoogle}
                className={styles.googleBtn}
              >
                <GoogleIcon className={styles.googleIcon} />
                <span>Continuar com Google</span>
              </Button>
            </div>
          )}

          {/* Alternância de modos no rodapé */}
          <footer className={styles.formFooter}>
            {modo === MODOS.ENTRAR && (
              <p className={styles.switchText}>
                Não tem uma conta?{" "}
                <button
                  type="button"
                  className={styles.switchButton}
                  onClick={() => mudarModo(MODOS.CADASTRAR)}
                  disabled={enviando}
                >
                  Cadastre-se
                </button>
              </p>
            )}

            {modo === MODOS.CADASTRAR && (
              <p className={styles.switchText}>
                Já tem uma conta?{" "}
                <button
                  type="button"
                  className={styles.switchButton}
                  onClick={() => mudarModo(MODOS.ENTRAR)}
                  disabled={enviando}
                >
                  Entrar
                </button>
              </p>
            )}

            {modo === MODOS.RECUPERAR && (
              <p className={styles.switchText}>
                Lembrou da senha?{" "}
                <button
                  type="button"
                  className={styles.switchButton}
                  onClick={() => mudarModo(MODOS.ENTRAR)}
                  disabled={enviando}
                >
                  Voltar ao login
                </button>
              </p>
            )}
          </footer>
        </div>
      </section>
    </main>
  );
}
