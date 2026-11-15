import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <p className={styles.copy}>
          © {new Date().getFullYear()} Horizonte. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
