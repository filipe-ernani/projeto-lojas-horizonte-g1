import crypto from "node:crypto";

export function requireApiKey(req, res, next) {
  const chaveEsperada = process.env.INTEGRACAO_API_KEY;

  if (!chaveEsperada || !chaveEsperada.trim()) {
    return res.status(503).json({ erro: "Serviço de integração não configurado." });
  }

  const chaveRecebida = req.headers["x-api-key"];
  if (!chaveRecebida || typeof chaveRecebida !== "string") {
    return res.status(401).json({ erro: "Chave de integração ausente ou inválida." });
  }

  const bufEsperado = Buffer.from(chaveEsperada.trim());
  const bufRecebido = Buffer.from(chaveRecebida.trim());

  if (
    bufEsperado.length !== bufRecebido.length ||
    !crypto.timingSafeEqual(bufEsperado, bufRecebido)
  ) {
    return res.status(401).json({ erro: "Chave de integração ausente ou inválida." });
  }

  next();
}
