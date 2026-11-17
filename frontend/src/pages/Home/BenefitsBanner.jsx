import { Link } from "react-router-dom";
import { Lock, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./BenefitsBanner.module.css";

const PILARES = [
  {
    id: "compra-transparente",
    icone: ShieldCheck,
    titulo: "Compra transparente",
    descricao: "Ambiente demonstrativo: nenhum pagamento real é feito.",
  },
  {
    id: "atendimento-inteligente",
    icone: MessageCircle,
    titulo: "Atendimento inteligente",
    descricao: "Assistente virtual para tirar dúvidas sobre os produtos.",
  },
  {
    id: "curadoria-moda",
    icone: Sparkles,
    titulo: "Curadoria de moda",
    descricao: "Seleção de peças casuais e essenciais.",
  },
  {
    id: "privacidade",
    icone: Lock,
    titulo: "Privacidade",
    descricao: (
      <>
        Saiba como tratamos seus dados na{" "}
        <Link to="/privacidade" className={styles.privacyLink}>
          Política de Privacidade
        </Link>
        .
      </>
    ),
  },
];

export default function BenefitsBanner() {
  return (
    <section className={styles.container} aria-label="Pilares da Lojas Horizonte">
      <div className={styles.grid}>
        {PILARES.map((item) => {
          const Icone = item.icone;
          return (
            <article key={item.id} className={styles.card}>
              <div className={styles.iconWrapper}>
                <Icone className={styles.icon} size={22} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className={styles.info}>
                <h3 className={styles.title} title={item.titulo}>{item.titulo}</h3>
                <p className={styles.description}>{item.descricao}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
