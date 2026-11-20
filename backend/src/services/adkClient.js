/**
 * Adaptador do agente de IA (Google ADK, `adk api_server`).
 *
 * Contrato:
 * - Sessão: GET /apps/{app}/users/{userId}/sessions/{sessionId}; se 404, POST no
 *   mesmo caminho com {}; em corrida ("já existe"), tenta o GET de novo.
 * - Execução: POST /run devolve uma LISTA de eventos. Ao site vai SOMENTE o texto
 *   final do agente; chamadas e resultados de ferramenta, raciocínio e JSON cru
 *   nunca saem daqui.
 *
 * Nada da mensagem, da resposta, dos eventos ou dos argumentos de ferramenta é
 * registrado em log.
 */

export const MENSAGENS_ADK = {
  indisponivel: "O assistente está indisponível agora.",
  timeout: "O assistente demorou para responder. Tente de novo.",
  invalido: "O assistente não conseguiu responder agora.",
};

export class AdkErro extends Error {
  constructor(status, codigo) {
    const mensagem =
      status === 504
        ? MENSAGENS_ADK.timeout
        : status === 503
          ? MENSAGENS_ADK.indisponivel
          : MENSAGENS_ADK.invalido;
    super(mensagem);
    this.name = "AdkErro";
    this.status = status;
    this.codigo = codigo;
  }
}

const CODIGOS_FORA_DO_AR = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
]);

const TIMEOUT_PADRAO_MS = 60000;

/**
 * Lê a configuração do agente a partir do ambiente. Devolve null sem ADK_URL.
 */
export function lerConfigAdk(env = process.env) {
  const baseUrl = normalizarBaseUrl(env.ADK_URL);
  if (!baseUrl) return null;

  const appName = String(env.ADK_APP_NAME || "").trim() || "agente_horizonte";
  const timeoutLido = Number(env.ADK_TIMEOUT_MS);
  const timeoutMs =
    Number.isFinite(timeoutLido) && timeoutLido > 0 ? timeoutLido : TIMEOUT_PADRAO_MS;

  return { baseUrl, appName, timeoutMs };
}

/**
 * URL base sem barra final e sem os sufixos /chat ou /run.
 */
export function normalizarBaseUrl(url) {
  if (typeof url !== "string") return "";
  let limpa = url.trim();
  let anterior;
  do {
    anterior = limpa;
    limpa = limpa.replace(/\/+$/, "").replace(/\/(chat|run)$/i, "");
  } while (limpa !== anterior);
  return limpa;
}

function partesDoEvento(evento) {
  const partes = evento?.content?.parts;
  return Array.isArray(partes) ? partes : [];
}

function ehParteDeTexto(parte) {
  if (!parte || typeof parte !== "object") return false;
  if (typeof parte.text !== "string" || parte.text.trim() === "") return false;
  if (parte.functionCall || parte.function_call) return false;
  if (parte.functionResponse || parte.function_response) return false;
  if (parte.thought === true) return false;
  return true;
}

/**
 * Percorre os eventos de trás para frente e devolve o texto do primeiro evento
 * do agente (author != "user") que tenha texto; só as parts de texto puro entram.
 * Devolve "" quando não há texto aproveitável.
 */
export function extrairTextoFinal(eventos) {
  if (!Array.isArray(eventos)) return "";

  for (let i = eventos.length - 1; i >= 0; i -= 1) {
    const evento = eventos[i];
    if (!evento || typeof evento !== "object") continue;
    if (evento.author === "user") continue;

    const textos = partesDoEvento(evento)
      .filter(ehParteDeTexto)
      .map((parte) => parte.text);

    if (textos.length > 0) {
      return textos.join("").trim();
    }
  }
  return "";
}

/**
 * Defesa extra: texto final que parece chamada de ferramenta ou JSON cru é inválido.
 */
export function pareceSaidaInterna(texto) {
  const t = String(texto || "").trim();
  if (!t) return true;
  if (/^(tool\s*\(|tool_call|toolcall|function_?call|function_?response)/i.test(t)) {
    return true;
  }
  const pareceObjeto = t.startsWith("{") && t.endsWith("}");
  const pareceLista = t.startsWith("[") && t.endsWith("]");
  return pareceObjeto || pareceLista;
}

function traduzirFalha(erro) {
  if (erro instanceof AdkErro) return erro;
  if (erro?.name === "TimeoutError" || erro?.name === "AbortError") {
    return new AdkErro(504, "timeout");
  }
  const codigo = erro?.cause?.code || erro?.code || null;
  if (codigo && CODIGOS_FORA_DO_AR.has(codigo)) {
    return new AdkErro(503, codigo);
  }
  if (erro instanceof TypeError) {
    // fetch falhou antes de obter resposta (rede, DNS ou URL inválida)
    return new AdkErro(503, codigo || "rede");
  }
  return new AdkErro(502, codigo || "desconhecido");
}

async function lerJson(resposta) {
  try {
    return await resposta.json();
  } catch (erro) {
    if (erro?.name === "TimeoutError" || erro?.name === "AbortError") throw erro;
    throw new AdkErro(502, "json");
  }
}

async function garantirSessao(config, userId, sessionId, signal) {
  const url =
    `${config.baseUrl}/apps/${encodeURIComponent(config.appName)}` +
    `/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}`;

  const consulta = await fetch(url, { method: "GET", signal });
  if (consulta.ok) {
    await consulta.body?.cancel();
    return;
  }
  await consulta.body?.cancel();
  if (consulta.status !== 404) {
    throw new AdkErro(502, `sessao-${consulta.status}`);
  }

  const criacao = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    signal,
  });
  await criacao.body?.cancel();
  if (criacao.ok) return;

  // Outra requisição pode ter criado a mesma sessão antes: confere de novo
  const reconsulta = await fetch(url, { method: "GET", signal });
  await reconsulta.body?.cancel();
  if (!reconsulta.ok) {
    throw new AdkErro(502, `sessao-criar-${criacao.status}`);
  }
}

/**
 * Envia a mensagem ao agente e devolve somente o texto final validado.
 * Lança AdkErro (status 502, 503 ou 504) em qualquer falha.
 */
export async function perguntarAoAgente({ config, userId, sessionId, texto }) {
  if (!config) throw new AdkErro(503, "sem-config");

  const signal = AbortSignal.timeout(config.timeoutMs);

  try {
    await garantirSessao(config, userId, sessionId, signal);

    const resposta = await fetch(`${config.baseUrl}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appName: config.appName,
        userId,
        sessionId,
        newMessage: { role: "user", parts: [{ text: texto }] },
      }),
      signal,
    });

    if (!resposta.ok) {
      await resposta.body?.cancel();
      throw new AdkErro(502, `run-${resposta.status}`);
    }

    const eventos = await lerJson(resposta);
    const textoFinal = extrairTextoFinal(eventos);

    if (!textoFinal || pareceSaidaInterna(textoFinal)) {
      throw new AdkErro(502, "sem-texto");
    }
    return textoFinal;
  } catch (erro) {
    throw traduzirFalha(erro);
  }
}
