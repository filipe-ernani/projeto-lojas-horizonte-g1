import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import ChatWidget from "@/components/ChatWidget/ChatWidget";
import styles from "./Layout.module.css";

/**
 * Layout principal do Horizonte:
 * - Cabeçalho, conteúdo das páginas (Outlet) e rodapé.
 * - ChatWidget flutuante montado exclusivamente para usuário autenticado
 *   e fora das rotas /login e /checkout conforme regra do projeto.
 */
export default function Layout() {
  const { usuario } = useAuth();
  const location = useLocation();

  const rotasSemChat = ["/login", "/checkout"];
  const exibirChat =
    Boolean(usuario) &&
    !rotasSemChat.some((rota) => location.pathname.startsWith(rota));

  return (
    <div className={styles.shell}>
      <Header />
      <main className={styles.main}>
        <Outlet />
      </main>
      <Footer />
      {exibirChat ? <ChatWidget /> : null}
    </div>
  );
}
