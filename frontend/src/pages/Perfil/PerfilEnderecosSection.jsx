import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import Button from "@/components/ui/Button/Button";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import AddressCard from "@/components/AddressCard/AddressCard";
import PerfilEnderecoForm from "./PerfilEnderecoForm";
import styles from "./PerfilEnderecosSection.module.css";

/**
 * Seção de endereços do usuário (/perfil):
 * - Lista de endereços cadastrados (AddressCard).
 * - Formulário para criar ou editar endereço.
 * - Estado vazio com EmptyState e ação de adicionar endereço.
 */
export default function PerfilEnderecosSection({
  enderecos = [],
  onSalvarEndereco,
  onExcluirEndereco,
  onDefinirPadrao,
}) {
  const [criando, setCriando] = useState(false);
  const [enderecoEmEdicao, setEnderecoEmEdicao] = useState(null);

  const mostrandoFormulario = criando || Boolean(enderecoEmEdicao);

  function handleNovo() {
    setEnderecoEmEdicao(null);
    setCriando(true);
  }

  function handleEditar(endereco) {
    setCriando(false);
    setEnderecoEmEdicao(endereco);
  }

  function handleCancelar() {
    setCriando(false);
    setEnderecoEmEdicao(null);
  }

  async function handleSalvar(dados) {
    if (typeof onSalvarEndereco === "function") {
      await onSalvarEndereco(dados);
    }
    handleCancelar();
  }

  return (
    <section className={styles.section} aria-labelledby="meus-enderecos-title">
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h2 id="meus-enderecos-title" className={styles.title}>
            Meus endereços
          </h2>
          <p className={styles.subtitle}>
            Gerencie seus endereços para agilizar o processo de entrega.
          </p>
        </div>

        {!mostrandoFormulario ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNovo}
            className={styles.addBtn}
          >
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            <span>Novo endereço</span>
          </Button>
        ) : null}
      </div>

      {mostrandoFormulario ? (
        <PerfilEnderecoForm
          enderecoInicial={enderecoEmEdicao}
          onSalvar={handleSalvar}
          onCancelar={handleCancelar}
        />
      ) : enderecos.length === 0 ? (
        <EmptyState
          icone={MapPin}
          titulo="Nenhum endereço cadastrado"
          mensagem="Você ainda não salvou nenhum local de entrega. Adicione um endereço para finalizar suas compras mais rápido."
          textoAcao="Adicionar endereço"
          onAcao={handleNovo}
        />
      ) : (
        <div className={styles.list}>
          {enderecos.map((endereco) => (
            <AddressCard
              key={endereco.id}
              endereco={endereco}
              onEditar={handleEditar}
              onExcluir={onExcluirEndereco}
              onDefinirPadrao={onDefinirPadrao}
            />
          ))}
        </div>
      )}
    </section>
  );
}
