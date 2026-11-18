import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import useCarrinho from "@/hooks/useCarrinho";
import useEnderecos from "@/hooks/useEnderecos";
import { finalizarCarrinho } from "@/services/carrinhoService";
import OrderSummary from "@/components/OrderSummary/OrderSummary";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import CheckoutHeader from "./CheckoutHeader";
import CheckoutEndereco from "./CheckoutEndereco";
import CheckoutPagamento from "./CheckoutPagamento";
import CheckoutSuccess from "./CheckoutSuccess";
import CheckoutSkeleton from "./CheckoutSkeleton";
import styles from "./Checkout.module.css";

/**
 * Página de Checkout (/checkout) conforme docs/DESIGN.md:
 * - Compra SIMULADA (nenhum pagamento real).
 * - Conectada a useCarrinho e useEnderecos reais.
 * - Cabeçalho simplificado com logo e indicador de passos (Cesta, Entrega e pagamento, Confirmação).
 * - Seções separadas de endereço e pagamento.
 * - Resumo com OrderSummary (total nunca calculado no front).
 * - Botão 'Finalizar pedido' desabilitado até haver endereço e pagamento selecionados.
 * - Suporta estados: carregando (skeleton), erro, vazio e confirmação de sucesso.
 */
export default function Checkout({
  enderecos: enderecosProp,
  carrinho: carrinhoProp,
  estadoInicial,
  onFinalizar,
  pedidoCriado = null,
}) {
  const {
    itens: itensContexto,
    subtotal: subtotalContexto,
    frete: freteContexto,
    total: totalContexto,
    carregando: carregandoCarrinho,
    erro: erroCarrinho,
    recarregar: recarregarCarrinho,
  } = useCarrinho();

  const {
    enderecos: enderecosContexto,
    carregando: carregandoEnderecos,
    erro: erroEnderecos,
    recarregar: recarregarEnderecos,
  } = useEnderecos();

  const itens =
    carrinhoProp?.itens !== undefined ? carrinhoProp.itens : itensContexto;
  const subtotal =
    carrinhoProp?.subtotal !== undefined
      ? carrinhoProp.subtotal
      : subtotalContexto;
  const frete =
    carrinhoProp?.frete !== undefined ? carrinhoProp.frete : freteContexto;
  const total =
    carrinhoProp?.total !== undefined ? carrinhoProp.total : totalContexto;
  const enderecos =
    enderecosProp !== undefined ? enderecosProp : enderecosContexto;

  const carregando =
    estadoInicial === "carregando" ||
    (carrinhoProp === undefined && carregandoCarrinho) ||
    (enderecosProp === undefined && carregandoEnderecos);

  const erro =
    estadoInicial === "erro"
      ? new Error("Falha no checkout")
      : carrinhoProp === undefined && erroCarrinho
        ? erroCarrinho
        : enderecosProp === undefined && erroEnderecos
          ? erroEnderecos
          : null;

  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [sucessoPedido, setSucessoPedido] = useState(pedidoCriado);

  // Pré-seleciona o endereço padrão ou o primeiro da lista de forma declarativa
  const [enderecoSelecionadoManual, setEnderecoSelecionadoManual] =
    useState(null);

  const enderecoPadrao = enderecos.find((e) => e.padrao) || enderecos[0];
  const enderecoSelecionado =
    enderecoSelecionadoManual !== null
      ? enderecoSelecionadoManual
      : enderecoPadrao?.id || null;

  // Forma de pagamento padrão
  const [formaPagamento, setFormaPagamento] = useState("PIX");

  if (carregando) {
    return (
      <>
        <CheckoutHeader passoAtivo={2} />
        <main className={`container ${styles.main}`}>
          <CheckoutSkeleton />
        </main>
      </>
    );
  }

  if (erro) {
    return (
      <>
        <CheckoutHeader passoAtivo={2} />
        <main className={`container ${styles.main}`}>
          <EmptyState
            titulo="Não foi possível iniciar o checkout"
            mensagem={
              erro?.message || "Não foi possível carregar. Tente novamente."
            }
            textoAcao="Tentar de novo"
            onAcao={() => {
              recarregarCarrinho();
              recarregarEnderecos();
            }}
          />
        </main>
      </>
    );
  }

  // Se o pedido já foi finalizado com sucesso
  if (sucessoPedido || pedidoCriado) {
    const pedidoExibicao = sucessoPedido || pedidoCriado;
    return (
      <>
        <CheckoutHeader passoAtivo={3} />
        <main className={`container ${styles.main}`}>
          <CheckoutSuccess
            pedidoId={pedidoExibicao?.id}
            formaPagamento={formaPagamento}
          />
        </main>
      </>
    );
  }

  // Estado vazio: quando a cesta não possui itens
  const cestaVazia = itens.length === 0;
  if (cestaVazia) {
    return (
      <>
        <CheckoutHeader passoAtivo={1} />
        <main className={`container ${styles.main}`}>
          <EmptyState
            icone={ShoppingBag}
            titulo="Sua cesta está vazia"
            mensagem="Não é possível finalizar a compra sem produtos na cesta. Adicione itens antes de prosseguir."
            textoAcao="Explorar catálogo"
            para="/catalogo"
          />
        </main>
      </>
    );
  }

  const temEnderecos = Array.isArray(enderecos) && enderecos.length > 0;
  const podeFinalizar =
    temEnderecos &&
    Boolean(enderecoSelecionado) &&
    Boolean(formaPagamento) &&
    !enviando;

  async function handleFinalizarPedido() {
    if (!podeFinalizar) {
      return;
    }

    setEnviando(true);
    setErroEnvio(null);

    try {
      let resultado;
      if (onFinalizar) {
        resultado = await onFinalizar({
          enderecoId: enderecoSelecionado,
          formaPagamento,
        });
      } else {
        resultado = await finalizarCarrinho({
          enderecoId: enderecoSelecionado,
          formaPagamento,
        });
        await recarregarCarrinho();
      }

      if (resultado) {
        setSucessoPedido(resultado);
      }
    } catch (err) {
      setErroEnvio(
        err?.message || "Não foi possível concluir o pedido. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <CheckoutHeader passoAtivo={2} />

      <main className={`container ${styles.main}`}>
        <header className={styles.pageHeader}>
          <h1 className={styles.title}>Finalizar compra</h1>
          <p className={styles.subtitle}>
            Confira seu endereço de entrega e selecione a forma de pagamento simulada.
          </p>
        </header>

        <div className={styles.layout}>
          <div className={styles.formsColumn}>
            <CheckoutEndereco
              enderecos={enderecos}
              enderecoSelecionado={enderecoSelecionado}
              onSelecionar={setEnderecoSelecionadoManual}
            />

            <CheckoutPagamento
              formaPagamento={formaPagamento}
              onSelecionar={setFormaPagamento}
            />

            {erroEnvio ? (
              <p className={styles.errorMessage} role="alert">
                {erroEnvio}
              </p>
            ) : null}
          </div>

          <div className={styles.summaryColumn}>
            <OrderSummary
              subtotal={subtotal}
              frete={frete}
              total={total}
              desabilitado={!podeFinalizar}
              textoBotao={enviando ? "Finalizando pedido..." : "Finalizar pedido"}
              onAcao={handleFinalizarPedido}
            />
          </div>
        </div>
      </main>
    </>
  );
}
