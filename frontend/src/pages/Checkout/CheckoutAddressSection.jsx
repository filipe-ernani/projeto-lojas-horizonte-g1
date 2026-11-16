import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import AddressOption from "@/components/AddressOption/AddressOption";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import styles from "./CheckoutAddressSection.module.css";

/**
 * Seção de endereço de entrega do Checkout:
 * Exibe a lista de endereços para seleção por Radio e link para gerenciar no perfil.
 * Exibe EmptyState caso não haja endereços cadastrados.
 */
export default function CheckoutAddressSection({
  enderecos = [],
  enderecoSelecionado,
  onSelecionar,
}) {
  const temEnderecos = enderecos && enderecos.length > 0;

  return (
    <section className={styles.section} aria-labelledby="secao-endereco">
      <div className={styles.sectionHeader}>
        <h2 id="secao-endereco" className={styles.sectionTitle}>
          Endereço de entrega
        </h2>
        <Link to="/perfil" className={styles.sectionLink}>
          Gerenciar endereços
        </Link>
      </div>

      {!temEnderecos ? (
        <EmptyState
          icone={MapPin}
          titulo="Nenhum endereço cadastrado"
          mensagem="Cadastre um endereço no seu perfil para receber suas compras."
          textoAcao="Cadastrar endereço no perfil"
          para="/perfil"
        />
      ) : (
        <div className={styles.addressList}>
          {enderecos.map((endereco) => (
            <AddressOption
              key={endereco.id}
              endereco={endereco}
              selecionado={enderecoSelecionado === endereco.id}
              onSelecionar={onSelecionar}
            />
          ))}
        </div>
      )}
    </section>
  );
}
