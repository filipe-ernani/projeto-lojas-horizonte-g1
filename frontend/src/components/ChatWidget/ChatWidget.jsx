import { useCallback, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import { MessageCircle, X, Send } from "lucide-react";
import IconButton from "@/components/ui/IconButton/IconButton";
import useChat, { LIMITE_MENSAGEM_CHAT } from "@/hooks/useChat";
import ChatMessagesList from "./ChatMessagesList";
import { useChatFocusTrap } from "./useChatFocusTrap";
import styles from "./ChatWidget.module.css";

/**
 * ChatWidget — Assistente virtual com IA do Horizonte:
 * - Botão flutuante no canto inferior direito; painel role="dialog".
 * - Enter envia, Shift+Enter quebra linha; limite de 500 caracteres com contador.
 * - Na página de um produto, envia o SKU como contexto.
 * - Esc fecha, foco no campo ao abrir e focus trap no Tab.
 */
export default function ChatWidget() {
  const [aberto, setAberto] = useState(false);
  const [textoEntrada, setTextoEntrada] = useState("");

  const rotaProduto = useMatch("/produto/:id");
  const skuAtual = rotaProduto?.params?.id || null;

  const { mensagens, enviando, erro, enviar, tentarDeNovo } = useChat({ sku: skuAtual });

  const botaoFlutuanteRef = useRef(null);
  const painelRef = useRef(null);

  const fecharChat = useCallback(() => {
    setAberto(false);
    setTimeout(() => {
      botaoFlutuanteRef.current?.querySelector("button")?.focus();
    }, 50);
  }, []);

  useChatFocusTrap(aberto, painelRef, fecharChat);

  function enviarTexto(texto) {
    if (enviar(texto)) setTextoEntrada("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    enviarTexto(textoEntrada);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviarTexto(textoEntrada);
    }
  }

  const podeEnviar = textoEntrada.trim().length > 0 && !enviando;
  const noLimite = textoEntrada.length >= LIMITE_MENSAGEM_CHAT;

  return (
    <aside className={styles.widgetWrapper} aria-label="Assistente Horizonte">
      {!aberto ? (
        <div ref={botaoFlutuanteRef} className={styles.floatingTrigger}>
          <IconButton
            icone={MessageCircle}
            rotulo="Abrir chat com o assistente Horizonte"
            tamanho={60}
            onClick={() => setAberto(true)}
            className={styles.floatingButton}
          />
        </div>
      ) : (
        <div
          ref={painelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-titulo"
          className={styles.dialogPanel}
        >
          <header className={styles.panelHeader}>
            <div className={styles.headerTitleGroup}>
              <MessageCircle size={20} aria-hidden="true" className={styles.headerIcon} />
              <h2 id="chat-titulo" className={styles.panelTitle}>
                Assistente Horizonte
              </h2>
            </div>
            <IconButton
              icone={X}
              rotulo="Fechar assistente"
              onClick={fecharChat}
              className={styles.closeButton}
            />
          </header>

          <ChatMessagesList
            mensagens={mensagens}
            digitando={enviando}
            erro={erro}
            onTentarDeNovo={tentarDeNovo}
            onSugestao={enviarTexto}
            onAbrirProduto={fecharChat}
          />

          <form className={styles.inputForm} onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldWrapper}>
              <label htmlFor="chat-input-field" className="sr-only">
                Mensagem para o assistente
              </label>
              <textarea
                id="chat-input-field"
                className={styles.textarea}
                placeholder="Digite sua dúvida..."
                value={textoEntrada}
                maxLength={LIMITE_MENSAGEM_CHAT}
                rows={2}
                onChange={(e) => setTextoEntrada(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-describedby="chat-contador chat-dica"
              />
              <div className={styles.inputMeta}>
                <span id="chat-dica" className={styles.dica}>
                  Enter envia · Shift+Enter quebra linha
                </span>
                <span
                  id="chat-contador"
                  className={`${styles.contador} ${noLimite ? styles.contadorLimite : ""}`}
                >
                  {textoEntrada.length}/{LIMITE_MENSAGEM_CHAT}
                </span>
              </div>
            </div>
            <IconButton
              icone={Send}
              rotulo={enviando ? "Enviando mensagem" : "Enviar mensagem"}
              type="submit"
              disabled={!podeEnviar}
              className={styles.sendButton}
            />
          </form>
        </div>
      )}
    </aside>
  );
}
