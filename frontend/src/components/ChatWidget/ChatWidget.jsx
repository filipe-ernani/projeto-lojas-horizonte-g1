import { useState, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import IconButton from "@/components/ui/IconButton/IconButton";
import Field from "@/components/ui/Field/Field";
import ChatMessagesList from "./ChatMessagesList";
import { useChatFocusTrap } from "./useChatFocusTrap";
import styles from "./ChatWidget.module.css";

/**
 * ChatWidget — Assistente virtual com IA do Horizonte conforme docs/DESIGN.md:
 * - Botão flutuante preto 60px no canto inferior direito.
 * - Painel em role="dialog" com cabeçalho, mensagens, campo de texto e envio.
 * - sessaoId único gerado via crypto.randomUUID(), sem armazenamento em localStorage.
 * - Acessibilidade: Esc fecha, foco gerenciado ao abrir/fechar, focus trap no Tab.
 * - Estados de carregando (Digitando...), erro e vazio institucional sem respostas pré-fabricadas.
 */
export default function ChatWidget({ onEnviar }) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [textoEntrada, setTextoEntrada] = useState("");
  const [digitando, setDigitando] = useState(false);
  const [erro, setErro] = useState(null);
  const [ultimaMensagem, setUltimaMensagem] = useState(null);

  // ID de sessão mantido apenas em memória durante a sessão da página
  const [sessaoId] = useState(() => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return `sessao-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  });

  const botaoFlutuanteRef = useRef(null);
  const painelRef = useRef(null);

  function abrirChat() {
    setAberto(true);
  }

  function fecharChat() {
    setAberto(false);
    setTimeout(() => {
      botaoFlutuanteRef.current?.focus();
    }, 50);
  }

  // Gestão de foco acessível e tecla Esc / Tab trap
  useChatFocusTrap(aberto, painelRef, fecharChat);

  async function enviarMensagem(textoMensagem) {
    const texto = (textoMensagem || textoEntrada).trim();
    if (!texto || digitando) return;

    const novaMensagemUsuario = {
      id: `usr-${Date.now()}-${Math.random()}`,
      autor: "usuario",
      texto,
      timestamp: new Date().toISOString(),
    };

    setMensagens((prev) => [...prev, novaMensagemUsuario]);
    setTextoEntrada("");
    setErro(null);
    setDigitando(true);
    setUltimaMensagem(texto);

    try {
      if (typeof onEnviar !== "function") {
        throw new Error("Assistente indisponível no momento.");
      }
      const respostaApi = await onEnviar({ mensagem: texto, sessaoId });
      if (!respostaApi?.resposta) {
        throw new Error("Resposta inválida do assistente.");
      }

      const novaMensagemAssistente = {
        id: `ast-${Date.now()}-${Math.random()}`,
        autor: "assistente",
        texto: respostaApi.resposta,
        timestamp: new Date().toISOString(),
      };
      setMensagens((prev) => [...prev, novaMensagemAssistente]);
      setUltimaMensagem(null);
    } catch {
      setErro("O assistente está indisponível no momento. Tente novamente.");
    } finally {
      setDigitando(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    enviarMensagem();
  }

  function handleTentarDeNovo() {
    if (ultimaMensagem) {
      enviarMensagem(ultimaMensagem);
    } else {
      setErro(null);
    }
  }

  return (
    <aside className={styles.widgetWrapper} aria-label="Widget do Assistente">
      {!aberto ? (
        <div ref={botaoFlutuanteRef} tabIndex={-1} className={styles.floatingTrigger}>
          <IconButton
            icone={MessageCircle}
            rotulo="Abrir chat com assistente Horizonte"
            tamanho={60}
            onClick={abrirChat}
            className={styles.floatingButton}
          />
        </div>
      ) : (
        <div
          ref={painelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Assistente Horizonte"
          className={styles.dialogPanel}
        >
          <header className={styles.panelHeader}>
            <div className={styles.headerTitleGroup}>
              <MessageCircle size={20} aria-hidden="true" className={styles.headerIcon} />
              <h2 className={styles.panelTitle}>Assistente Horizonte</h2>
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
            digitando={digitando}
            erro={erro}
            onTentarDeNovo={handleTentarDeNovo}
          />

          <form className={styles.inputForm} onSubmit={handleSubmit} noValidate>
            <div className={styles.fieldWrapper}>
              <Field
                id="chat-input-field"
                placeholder="Digite sua dúvida..."
                value={textoEntrada}
                onChange={(e) => setTextoEntrada(e.target.value)}
                disabled={digitando}
                aria-label="Mensagem para o assistente"
                required
                className={styles.inputField}
              />
            </div>
            <IconButton
              icone={Send}
              rotulo="Enviar mensagem"
              type="submit"
              disabled={!textoEntrada.trim() || digitando}
              className={styles.sendButton}
            />
          </form>
        </div>
      )}
    </aside>
  );
}
