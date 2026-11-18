import { useAuth } from "@/context/AuthContext";
import usePerfil from "@/hooks/usePerfil";
import useEnderecos from "@/hooks/useEnderecos";
import AccountNav from "@/components/AccountNav/AccountNav";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import PerfilDadosSection from "./PerfilDadosSection";
import PerfilEnderecosSection from "./PerfilEnderecosSection";
import PerfilSkeleton from "./PerfilSkeleton";
import styles from "./Perfil.module.css";

/**
 * Página de Perfil (/perfil) conforme docs/DESIGN.md e docs/API.md:
 * - A rota é privada (dentro de PrivateRoute).
 * - Conectada aos hooks usePerfil e useEnderecos (dados reais da API).
 * - Menu lateral com AccountNav (aba ativa: 'perfil').
 * - Seção 'Meus dados' com nome/telefone editáveis e e-mail desativado (disabled + readOnly).
 * - Seção 'Meus endereços' com listagem, criação, edição, exclusão e definição de padrão.
 * - Estados: carregando (skeleton), erro (com "Tentar de novo") e vazio.
 * - Sem dados mockados (D-19).
 */
export default function Perfil({
  perfil: perfilProp,
  enderecos: enderecosProp,
  estadoInicial,
  onSalvarPerfil: onSalvarPerfilProp,
  onSalvarEndereco: onSalvarEnderecoProp,
  onExcluirEndereco: onExcluirEnderecoProp,
  onDefinirPadrao: onDefinirPadraoProp,
}) {
  const { usuario } = useAuth();

  const {
    perfil: perfilApi,
    carregando: carregandoPerfil,
    erro: erroPerfil,
    salvarPerfil: salvarPerfilApi,
    recarregar: recarregarPerfil,
  } = usePerfil();

  const {
    enderecos: enderecosApi,
    carregando: carregandoEnderecos,
    erro: erroEnderecos,
    criarEndereco,
    editarEndereco,
    excluirEndereco,
    definirPadrao,
    recarregar: recarregarEnderecos,
  } = useEnderecos();

  const perfil =
    perfilProp ||
    (perfilApi?.email
      ? perfilApi
      : {
          nome: usuario?.displayName || "",
          email: usuario?.email || "",
          telefone: usuario?.phoneNumber || "",
        });

  const enderecos =
    enderecosProp !== undefined ? enderecosProp : enderecosApi;

  const carregando =
    estadoInicial === "carregando" ||
    (perfilProp === undefined && carregandoPerfil) ||
    (enderecosProp === undefined && carregandoEnderecos);

  const erro =
    estadoInicial === "erro"
      ? new Error("Falha ao carregar perfil")
      : perfilProp === undefined && erroPerfil
        ? erroPerfil
        : enderecosProp === undefined && erroEnderecos
          ? erroEnderecos
          : null;

  async function handleSalvarPerfil(dados) {
    if (onSalvarPerfilProp) {
      return onSalvarPerfilProp(dados);
    }
    return salvarPerfilApi(dados);
  }

  async function handleSalvarEndereco(dados) {
    if (onSalvarEnderecoProp) {
      return onSalvarEnderecoProp(dados);
    }
    if (dados?.id) {
      return editarEndereco(dados.id, dados);
    }
    return criarEndereco(dados);
  }

  async function handleExcluirEndereco(id) {
    if (onExcluirEnderecoProp) {
      return onExcluirEnderecoProp(id);
    }
    return excluirEndereco(id);
  }

  async function handleDefinirPadrao(id, endereco) {
    if (onDefinirPadraoProp) {
      return onDefinirPadraoProp(id, endereco);
    }
    return definirPadrao(id, endereco);
  }

  function renderConteudo() {
    if (carregando) {
      return <PerfilSkeleton />;
    }

    if (erro) {
      return (
        <EmptyState
          titulo="Não foi possível carregar seu perfil"
          mensagem={
            erro?.message || "Não foi possível carregar. Tente novamente."
          }
          textoAcao="Tentar de novo"
          onAcao={() => {
            recarregarPerfil();
            recarregarEnderecos();
          }}
        />
      );
    }

    const enderecosExibicao = estadoInicial === "vazio" ? [] : enderecos;

    return (
      <div className={styles.sectionsContainer}>
        <PerfilDadosSection
          key={`${perfil?.email || ""}-${perfil?.nome || ""}`}
          perfil={perfil}
          onSalvarPerfil={handleSalvarPerfil}
        />
        <PerfilEnderecosSection
          enderecos={enderecosExibicao}
          onSalvarEndereco={handleSalvarEndereco}
          onExcluirEndereco={handleExcluirEndereco}
          onDefinirPadrao={handleDefinirPadrao}
        />
      </div>
    );
  }

  return (
    <main className={`container ${styles.main}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>Meu perfil</h1>
        <p className={styles.subtitle}>
          Gerencie seus dados pessoais, contatos e locais de entrega.
        </p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <AccountNav abaAtiva="perfil" />
        </aside>

        <section className={styles.content} aria-label="Conteúdo do perfil">
          {renderConteudo()}
        </section>
      </div>
    </main>
  );
}
