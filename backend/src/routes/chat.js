import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const LIMITE_MENSAGENS_POR_MINUTO = 20;
const historicoPorUsuario = new Map();

function checarRateLimit(usuarioId) {
  const agora = Date.now();
  const janelaInicio = agora - 60000;
  const historico = historicoPorUsuario.get(usuarioId) || [];
  const validos = historico.filter((t) => t > janelaInicio);

  if (validos.length >= LIMITE_MENSAGENS_POR_MINUTO) {
    return false;
  }

  validos.push(agora);
  historicoPorUsuario.set(usuarioId, validos);
  return true;
}

router.post("/chat", requireAuth, async (req, res) => {
  const { mensagem, sessaoId } = req.body || {};

  if (
    typeof mensagem !== "string" ||
    mensagem.trim().length === 0 ||
    mensagem.trim().length > 1000
  ) {
    return res.status(400).json({
      erro: "Mensagem inválida. Deve conter entre 1 e 1000 caracteres.",
    });
  }

  if (!checarRateLimit(req.usuarioId)) {
    return res.status(429).json({
      erro: "Limite de mensagens por minuto excedido. Tente novamente em instantes.",
    });
  }

  const adkUrl = process.env.ADK_URL;
  if (!adkUrl || !adkUrl.trim()) {
    return res.status(503).json({ erro: "Assistente indisponível no momento." });
  }

  try {
    const respostaAdk = await fetch(adkUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mensagem: mensagem.trim(),
        sessaoId: sessaoId || req.sessaoId || null,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!respostaAdk.ok) {
      console.error("Erro na resposta do agente ADK:", respostaAdk.status);
      return res.status(503).json({ erro: "Assistente indisponível no momento." });
    }

    const dados = await respostaAdk.json();
    res.json({ resposta: dados.resposta || "" });
  } catch (error_) {
    console.error("Falha ao comunicar com o agente ADK:", error_.message);
    res.status(503).json({ erro: "Assistente indisponível no momento." });
  }
});

export default router;
