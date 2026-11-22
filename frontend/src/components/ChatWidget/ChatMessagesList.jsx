import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button/Button";
import ChatProductCard from "./ChatProductCard";
import MarkdownText from "./MarkdownText";
import styles from "./ChatMessagesList.module.css";

const SUGESTOES = [
  "Qual peça combina com um evento de trabalho?",
  "Quais produtos de Beleza vocês têm?",
  "Preciso de um presente até R$ 100",
];

/**
 * Lista de mensagens do ChatWidget. O texto do assistente é sempre renderizado
 * como texto (nunca como HTML).
 */
export default function ChatMessagesList({
  mensagens = [],
  digitando = false,
  erro = null,
  onTentarDeNovo,
  onSugestao,
  onAbrirProduto,
}) {
  const finalListaRef = useRef(null);

  useEffect(() => {
    finalListaRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, digitando, erro]);

  return (
    <div className={styles.messagesContainer}>
      {mensagens.length === 0 ? (
        <div className={styles.welcomeBox}>
          <p className={styles.welcomeText}>
            Olá! Posso ajudar a escolher produtos e tirar dúvidas sobre a loja.
          </p>
          <ul className={styles.sugestoes} aria-label="Sugestões de perguntas">
            {SUGESTOES.map((sugestao) => (
              <li key={sugestao}>
                <button
                  type="button"
                  className={styles.sugestao}
                  onClick={() => onSugestao?.(sugestao)}
                  disabled={digitando}
                >
                  {sugestao}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div role="log" aria-live="polite" aria-label="Mensagens do chat" className={styles.log}>
        {mensagens.map((msg) => {
          const ehUsuario = msg.autor === "usuario";
          return (
            <div
              key={msg.id}
              className={`${styles.messageRow} ${ehUsuario ? styles.userRow : styles.assistantRow}`}
            >
              <div className={styles.messageGroup}>
                <div
                  className={`${styles.bubble} ${ehUsuario ? styles.userBubble : styles.assistantBubble}`}
                >
                  <span className="sr-only">{ehUsuario ? "Você disse:" : "Assistente:"}</span>
                  {ehUsuario ? (
                    <p className={styles.bubbleText}>{msg.texto}</p>
                  ) : (
                    <MarkdownText texto={msg.texto} />
                  )}
                </div>
                {!ehUsuario && msg.produtos?.length > 0 ? (
                  <ul className={styles.produtos} aria-label="Produtos citados">
                    {msg.produtos.map((produto) => (
                      <li key={produto.sku}>
                        <ChatProductCard produto={produto} onAbrir={onAbrirProduto} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
          );
        })}

        {digitando ? (
          <div className={`${styles.messageRow} ${styles.assistantRow}`}>
            <div className={`${styles.bubble} ${styles.assistantBubble}`}>
              <p className={styles.typingText}>O assistente está digitando...</p>
            </div>
          </div>
        ) : null}

        {erro ? (
          <div className={styles.errorBox} role="alert">
            <p className={styles.errorText}>{erro.mensagem}</p>
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
      </div>

      <div ref={finalListaRef} />
    </div>
  );
}
