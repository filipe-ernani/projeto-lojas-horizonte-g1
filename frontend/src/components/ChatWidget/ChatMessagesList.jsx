import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button/Button";
import styles from "./ChatMessagesList.module.css";

/**
 * Lista de mensagens do ChatWidget:
 * - Exibe frase institucional de boas-vindas quando vazia.
 * - Mensagens do assistente alinhadas à esquerda (--color-surface).
 * - Mensagens do usuário alinhadas à direita (--color-ink).
 * - Indicador de "Digitando..." e caixa de erro com botão "Tentar de novo".
 */
export default function ChatMessagesList({
  mensagens = [],
  digitando = false,
  erro = null,
  onTentarDeNovo,
}) {
  const finalListaRef = useRef(null);

  useEffect(() => {
    finalListaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, digitando, erro]);

  return (
    <div
      className={styles.messagesContainer}
      role="log"
      aria-live="polite"
      aria-label="Mensagens do chat"
    >
      {mensagens.length === 0 ? (
        <div className={styles.welcomeBox}>
          <p className={styles.welcomeText}>
            Olá! Posso ajudar com produtos e pedidos.
          </p>
        </div>
      ) : null}

      {mensagens.map((msg) => {
        const ehUsuario = msg.autor === "usuario";
        return (
          <div
            key={msg.id}
            className={`${styles.messageRow} ${ehUsuario ? styles.userRow : styles.assistantRow}`}
          >
            <div
              className={`${styles.bubble} ${ehUsuario ? styles.userBubble : styles.assistantBubble}`}
            >
              <p className={styles.bubbleText}>{msg.texto}</p>
            </div>
          </div>
        );
      })}

      {digitando ? (
        <div className={`${styles.messageRow} ${styles.assistantRow}`}>
          <div className={`${styles.bubble} ${styles.assistantBubble}`}>
            <p className={styles.typingText}>Digitando...</p>
          </div>
        </div>
      ) : null}

      {erro ? (
        <div className={styles.errorBox} role="alert">
          <p className={styles.errorText}>{erro}</p>
          {onTentarDeNovo ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onTentarDeNovo}
              className={styles.retryBtn}
            >
              Tentar de novo
            </Button>
          ) : null}
        </div>
      ) : null}

      <div ref={finalListaRef} />
    </div>
  );
}
