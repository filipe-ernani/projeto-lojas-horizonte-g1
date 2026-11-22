import { useCallback, useEffect, useRef, useState } from "react";
import { useMatch } from "react-router-dom";
import { MessageCircle, X, Send } from "lucide-react";
import IconButton from "@/components/ui/IconButton/IconButton";
import useChat, { LIMITE_MENSAGEM_CHAT } from "@/hooks/useChat";
import useHoriEstado from "@/hooks/useHoriEstado";
import ChatMessagesList from "./ChatMessagesList";
import HoriAvatar from "./HoriAvatar";
import { precarregarHori } from "./horiAssets";
import { useChatFocusTrap } from "./useChatFocusTrap";
import styles from "./ChatWidget.module.css";

// Mensagem local: só aparece na tela, nunca vai ao agente nem ao back-end
const BOAS_VINDAS =
  "Oi! Eu sou a Hori, assistente da Lojas Horizonte. Posso ajudar a escolher peças ou tirar dúvidas.";
const CHAVE_BOAS_VINDAS_VISTA = "horizonte_hori_boas_vindas_vista";

function boasVindasJaVista() {
  try {
    return sessionStorage.getItem(CHAVE_BOAS_VINDAS_VISTA) === "1";
  } catch {
    return false;
  }
}

function marcarBoasVindasVista() {
  try {
    sessionStorage.setItem(CHAVE_BOAS_VINDAS_VISTA, "1");
  } catch {
    // sessionStorage indisponível: o controle fica só em memória
  }
}

function rotuloBotao(naoLidas) {
  if (naoLidas <= 0) return "Abrir chat com a Hori";
  const texto = naoLidas === 1 ? "1 mensagem não lida" : `${naoLidas} mensagens não lidas`;
  return `Abrir chat com a Hori, ${texto}`;
}

/**
 * ChatWidget — Hori, assistente virtual com IA do Horizonte:
 * - Botão flutuante com selo de mensagens não lidas; painel role="dialog".
 * - Cabeçalho fixo com o avatar da Hori (neutra, pensando, feliz).
 * - Enter envia, Shift+Enter quebra linha; limite de 500 caracteres com contador.
 * - Na página de um produto, envia o SKU como contexto.
 * - Esc fecha, foco no campo ao abrir e focus trap no Tab.
 * - O histórico fica no hook useChat deste componente, então sobrevive a fechar e abrir o painel.
 */
export default function ChatWidget() {
  const [aberto, setAberto] = useState(false);
  const [textoEntrada, setTextoEntrada] = useState("");
  const [boasVindasPendente, setBoasVindasPendente] = useState(() => !boasVindasJaVista());
  const [respostasVistas, setRespostasVistas] = useState(0);

  const rotaProduto = useMatch("/produto/:id");
  const skuAtual = rotaProduto?.params?.id || null;

  const { mensagens, enviando, erro, enviar, tentarDeNovo } = useChat({ sku: skuAtual });

  const respostas = mensagens.filter((msg) => msg.autor === "assistente");
  const idUltimaResposta = respostas.length ? respostas[respostas.length - 1].id : null;
  const { estado: estadoHori, voltarNeutra } = useHoriEstado({ enviando, idUltimaResposta });

  // Só conta o que chegou com o painel fechado; erros não são mensagens e não contam
  const naoLidas = aberto
    ? 0
    : (boasVindasPendente ? 1 : 0) + Math.max(0, respostas.length - respostasVistas);
  const seloTexto = naoLidas > 9 ? "9+" : String(naoLidas);

  const botaoFlutuanteRef = useRef(null);
  const painelRef = useRef(null);

  useEffect(() => {
    precarregarHori();
  }, []);

  function abrirChat() {
    setAberto(true);
    if (boasVindasPendente) {
      setBoasVindasPendente(false);
      marcarBoasVindasVista();
    }
  }

  const totalRespostas = respostas.length;
  const fecharChat = useCallback(() => {
    setAberto(false);
    // Tudo que chegou com o painel aberto já foi visto
    setRespostasVistas(totalRespostas);
    setTimeout(() => {
      botaoFlutuanteRef.current?.querySelector("button")?.focus();
    }, 50);
  }, [totalRespostas]);

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

  function handleChange(e) {
    setTextoEntrada(e.target.value);
    voltarNeutra();
  }

  const podeEnviar = textoEntrada.trim().length > 0 && !enviando;
  const noLimite = textoEntrada.length >= LIMITE_MENSAGEM_CHAT;

  return (
    <aside className={styles.widgetWrapper} aria-label="Hori, assistente da Lojas Horizonte">
      {!aberto ? (
        <div ref={botaoFlutuanteRef} className={styles.floatingTrigger}>
          <IconButton
            icone={MessageCircle}
            rotulo={rotuloBotao(naoLidas)}
            tamanho={60}
            onClick={abrirChat}
            className={styles.floatingButton}
          />
          <span
            role="status"
            className={`${styles.selo} ${naoLidas > 0 ? styles.seloVisivel : ""}`}
          >
            {naoLidas > 0 ? (
              <>
                <span aria-hidden="true">{seloTexto}</span>
                <span className="sr-only">
                  {naoLidas === 1 ? "1 mensagem não lida" : `${naoLidas} mensagens não lidas`}
                </span>
              </>
            ) : null}
          </span>
        </div>
      ) : (
        <div
          ref={painelRef}
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-titulo"
          aria-describedby="chat-subtitulo"
          className={styles.dialogPanel}
        >
          <header className={styles.panelHeader}>
            <div className={styles.headerTitleGroup}>
              <HoriAvatar estado={estadoHori} tamanho={40} />
              <div className={styles.headerTexts}>
                <h2 id="chat-titulo" className={styles.panelTitle}>
                  Hori
                </h2>
                <p id="chat-subtitulo" className={styles.panelSubtitle}>
                  Assistente da Lojas Horizonte
                </p>
              </div>
            </div>
            <IconButton
              icone={X}
              rotulo="Fechar assistente"
              onClick={fecharChat}
              className={styles.closeButton}
            />
          </header>

          <ChatMessagesList
            boasVindas={BOAS_VINDAS}
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
                Mensagem para a Hori
              </label>
              <textarea
                id="chat-input-field"
                className={styles.textarea}
                placeholder="Digite sua dúvida..."
                value={textoEntrada}
                maxLength={LIMITE_MENSAGEM_CHAT}
                rows={2}
                onChange={handleChange}
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
