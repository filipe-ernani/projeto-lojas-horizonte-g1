import { CheckCircle2, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import styles from "./BenefitsBanner.module.css";

const PILARES = [
  {
    id: "seguranca",
    icone: ShieldCheck,
    titulo: "Compra segura",
    descricao: "Transações protegidas e privacidade garantida em todas as etapas.",
  },
  {
    id: "atendimento",
    icone: MessageCircle,
    titulo: "Atendimento inteligente",
    descricao: "Assistente virtual e canal dedicado para tirar suas dúvidas com agilidade.",
  },
  {
    id: "curadoria",
    icone: Sparkles,
    titulo: "Curadoria de moda",
    descricao: "Peças contemporâneas selecionadas com foco em conforto, caimento e estilo atemporal.",
  },
  {
    id: "qualidade",
    icone: CheckCircle2,
    titulo: "Qualidade e transparência",
    descricao: "Especificações claras de materiais e compromisso com o acabamento de cada peça.",
  },
];

/**
 * Faixa institucional com os pilares da loja conforme docs/DESIGN.md e D-24:
 * Sem prazos ou valores inventados (honestidade e foco no valor real).
 */
export default function BenefitsBanner() {
  return (
    <section className={styles.container} aria-label="Pilares da Lojas Horizonte">
      <div className={styles.grid}>
        {PILARES.map((item) => {
          const Icone = item.icone;
          return (
            <article key={item.id} className={styles.card}>
              <div className={styles.iconWrapper}>
                <Icone className={styles.icon} size={24} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <div className={styles.info}>
                <h3 className={styles.title}>{item.titulo}</h3>
                <p className={styles.description}>{item.descricao}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
