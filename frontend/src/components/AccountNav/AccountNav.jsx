import { Link, useNavigate } from "react-router-dom";
import { Heart, LogOut, Package, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import styles from "./AccountNav.module.css";

/**
 * Menu lateral de navegação da conta do usuário conforme docs/DESIGN.md:
 * Links para Perfil, Meus pedidos, Favoritos e ação de Sair.
 */
export default function AccountNav({ abaAtiva = "pedidos" }) {
  const { sair } = useAuth();
  const navigate = useNavigate();

  async function handleSair() {
    try {
      if (sair) {
        await sair();
      }
      void navigate("/", { replace: true });
    } catch {
      void navigate("/", { replace: true });
    }
  }

  const itens = [
    { id: "perfil", rotulo: "Meu perfil", para: "/perfil", icone: User },
    { id: "pedidos", rotulo: "Meus pedidos", para: "/pedidos", icone: Package },
    { id: "favoritos", rotulo: "Favoritos", para: "/favoritos", icone: Heart },
  ];

  return (
    <nav className={styles.nav} aria-label="Menu da conta">
      <ul className={styles.list}>
        {itens.map((item) => {
          const Icone = item.icone;
          const isAtivo = abaAtiva === item.id;

          return (
            <li key={item.id} className={styles.item}>
              <Link
                to={item.para}
                className={`${styles.link} ${isAtivo ? styles.active : ""}`}
                aria-current={isAtivo ? "page" : undefined}
              >
                <Icone size={18} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.rotulo}</span>
              </Link>
            </li>
          );
        })}

        <li className={styles.item}>
          <button
            type="button"
            onClick={handleSair}
            className={styles.logoutButton}
            aria-label="Sair da conta"
          >
            <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>Sair</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
