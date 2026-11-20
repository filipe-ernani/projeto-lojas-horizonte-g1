import { Link } from "react-router-dom";
import Button from "@/components/ui/Button/Button";
import styles from "./PageSkeleton.module.css";

export default function PageSkeleton({
  titulo,
  descricao = "Esta tela está em construção e receberá os dados reais assim que a API estiver pronta.",
  textoAcao = "Voltar ao início",
  para = "/",
}) {
  return (
    <section className={styles.section}>
      <h1>{titulo}</h1>
      <div className={styles.emptyCard}>
        <p className={styles.description}>{descricao}</p>
        <Link to={para} className={styles.actionLink}>
          <Button variant="primary" size="sm">
            {textoAcao}
          </Button>
        </Link>
      </div>
    </section>
  );
}
