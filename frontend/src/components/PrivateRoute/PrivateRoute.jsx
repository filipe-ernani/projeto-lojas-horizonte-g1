import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import styles from "./PrivateRoute.module.css";

export default function PrivateRoute({ children }) {
  const { usuario, carregando } = useAuth();
  const location = useLocation();

  if (carregando) {
    return (
      <div
        className={`container ${styles.loading}`}
        aria-busy="true"
        aria-label="Verificando sessão"
      >
        <div className={styles.titleBlock} />
        <div className={styles.contentBlock} />
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children || <Outlet />;
}
