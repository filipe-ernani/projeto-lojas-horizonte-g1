import { Outlet } from "react-router-dom";
import Header from "@/components/Header/Header";
import Footer from "@/components/Footer/Footer";
import styles from "./Layout.module.css";

export default function Layout() {
  return (
    <div className={styles.shell}>
      <Header />
      <main className={`container ${styles.main}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
