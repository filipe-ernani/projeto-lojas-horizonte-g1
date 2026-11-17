import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AccountNav from "@/components/AccountNav/AccountNav";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import PerfilDadosSection from "./PerfilDadosSection";
import PerfilEnderecosSection from "./PerfilEnderecosSection";
import PerfilSkeleton from "./PerfilSkeleton";
import styles from "./Perfil.module.css";

/**
 * Página de Perfil (/perfil) conforme docs/DESIGN.md e docs/API.md:
 * - A rota é privada (dentro de PrivateRoute).
 * - Menu lateral com AccountNav (aba ativa: 'perfil').
 * - Seção 'Meus dados' com nome/telefone editáveis e e-mail desativado (disabled + readOnly).
 * - Seção 'Meus endereços' com lista de AddressCard e formulário de endereço.
 * - Estados: carregando (skeleton), erro (EmptyState com retry) e vazio (EmptyState na seção de endereços).
 * - Sem dados mockados: recebe dados e handlers por props, usando a sessão do useAuth como fallback.
 */
export default function Perfil({
  perfil: perfilProp,
  enderecos = [],
  estadoInicial = "normal",
  onSalvarPerfil,
  onSalvarEndereco,
  onExcluirEndereco,
}) {
  const { usuario } = useAuth();
  const [estado, setEstado] = useState(estadoInicial);

  const perfil = perfilProp || {
    nome: usuario?.displayName || "",
    email: usuario?.email || "",
    telefone: usuario?.phoneNumber || "",
  };

  function renderConteudo() {
    if (estado === "carregando") {
      return <PerfilSkeleton />;
    }

    if (estado === "erro") {
      return (
        <EmptyState
          titulo="Não foi possível carregar seu perfil"
          mensagem="Ocorreu um erro ao buscar seus dados e endereços. Tente novamente em instantes."
          textoAcao="Tentar de novo"
          onAcao={() => setEstado("normal")}
        />
      );
    }

    const enderecosExibicao = estado === "vazio" ? [] : enderecos;

    return (
      <div className={styles.sectionsContainer}>
        <PerfilDadosSection
          key={`${perfil?.email || ""}-${perfil?.nome || ""}`}
          perfil={perfil}
          onSalvarPerfil={onSalvarPerfil}
        />
        <PerfilEnderecosSection
          enderecos={enderecosExibicao}
          onSalvarEndereco={onSalvarEndereco}
          onExcluirEndereco={onExcluirEndereco}
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
