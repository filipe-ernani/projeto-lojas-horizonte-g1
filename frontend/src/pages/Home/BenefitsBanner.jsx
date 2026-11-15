import { Headphones, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import styles from "./BenefitsBanner.module.css";

const BENEFICIOS = [
  {
    id: "frete",
    icone: Truck,
    titulo: "Frete grátis",
    descricao: "Para compras selecionadas em todo o país",
  },
  {
    id: "troca",
    icone: RotateCcw,
    titulo: "Devolução simples",
    descricao: "Até 30 dias para troca sem burocracia",
  },
  {
    id: "pagamento",
    icone: ShieldCheck,
    titulo: "Pagamento protegido",
    descricao: "Simulação com Pix, Cartão ou Boleto",
  },
  {
    id: "suporte",
    icone: Headphones,
    titulo: "Suporte dedicado",
    descricao: "Atendimento ágil para tirar dúvidas",
  },
];

/**
 * Faixa de benefícios da loja com conteúdo fixo e sem marcas reais.
 */
export default function BenefitsBanner() {
  return (
    <section className={styles.container} aria-label="Benefícios da loja">
      <div className={styles.grid}>
        {BENEFICIOS.map((item) => {
          const Icone = item.icone;
          return (
            <article key={item.id} className={styles.card}>
              <div className={styles.iconWrapper}>
                <Icone className={styles.icon} size={24} strokeWidth={1.8} />
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
