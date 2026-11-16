import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import OrderSummary from "@/components/OrderSummary/OrderSummary";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import CheckoutHeader from "./CheckoutHeader";
import CheckoutAddressSection from "./CheckoutAddressSection";
import CheckoutPaymentSection from "./CheckoutPaymentSection";
import CheckoutSuccess from "./CheckoutSuccess";
import CheckoutSkeleton from "./CheckoutSkeleton";
import styles from "./Checkout.module.css";

/**
 * Página de Checkout (/checkout) conforme docs/DESIGN.md:
 * - Compra SIMULADA (nenhum pagamento real).
 * - Cabeçalho simplificado com logo e indicador de passos (Cesta, Entrega e pagamento, Confirmação).
 * - Seções separadas de endereço e pagamento.
 * - Resumo com OrderSummary (total nunca calculado no front).
 * - Botão 'Finalizar pedido' desabilitado até haver endereço e pagamento selecionados.
 * - Suporta estados: carregando (skeleton), erro, vazio e confirmação de sucesso.
 */
export default function Checkout({
  enderecos = [],
  carrinho = { itens: [], subtotal: 0, frete: 0, total: 0 },
  estadoInicial = "normal",
  onFinalizar,
  pedidoCriado = null,
}) {
  const [estado, setEstado] = useState(estadoInicial);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState(null);
  const [sucessoPedido, setSucessoPedido] = useState(pedidoCriado);

  const itens = carrinho?.itens || [];
  const subtotal = carrinho?.subtotal ?? 0;
  const frete = carrinho?.frete ?? 0;
  const total = carrinho?.total ?? 0;

  // Pré-seleciona o endereço padrão ou o primeiro da lista
  const enderecoPadrao = enderecos.find((e) => e.padrao) || enderecos[0];
  const [enderecoSelecionado, setEnderecoSelecionado] = useState(
    enderecoPadrao ? enderecoPadrao.id : null,
  );

  // Forma de pagamento padrão
  const [formaPagamento, setFormaPagamento] = useState("PIX");

  if (estado === "carregando") {
    return (
      <>
        <CheckoutHeader passoAtivo={2} />
        <main className={`container ${styles.main}`}>
          <CheckoutSkeleton />
        </main>
      </>
    );
  }

  if (estado === "erro") {
    return (
      <>
        <CheckoutHeader passoAtivo={2} />
        <main className={`container ${styles.main}`}>
          <EmptyState
            titulo="Não foi possível iniciar o checkout"
            mensagem="Ocorreu uma falha ao preparar o seu pedido. Tente novamente em instantes."
            textoAcao="Tentar de novo"
            onAcao={() => setEstado("normal")}
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
  const cestaVazia = estado === "vazio" || itens.length === 0;
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

  const temEnderecos = enderecos && enderecos.length > 0;
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
      if (onFinalizar) {
        const resultado = await onFinalizar({
          enderecoId: enderecoSelecionado,
          formaPagamento,
        });
        if (resultado) {
          setSucessoPedido(resultado);
        }
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
            <CheckoutAddressSection
              enderecos={enderecos}
              enderecoSelecionado={enderecoSelecionado}
              onSelecionar={setEnderecoSelecionado}
            />

            <CheckoutPaymentSection
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
