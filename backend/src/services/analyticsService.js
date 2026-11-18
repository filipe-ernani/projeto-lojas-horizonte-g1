import { query } from "../db.js";
import { auth } from "../firebase.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const sessoesConhecidas = new Set();

export function validarSessaoId(header) {
  if (typeof header === "string" && UUID_REGEX.test(header.trim())) {
    return header.trim();
  }
  return null;
}

export async function gravarEvento({
  evento,
  sessaoId,
  usuarioId = null,
  sku = null,
  quantidade = null,
  valor = null,
  pedidoId = null,
}) {
  if (!sessaoId) return;

  try {
    await query(
      `INSERT INTO loja.analytics_eventos (
        evento, sessao_id, usuario_id, sku, quantidade, valor, pedido_id, ocorrido_em
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, now());`,
      [evento, sessaoId, usuarioId, sku, quantidade, valor, pedidoId],
    );
  } catch (error_) {
    console.error("Erro ao gravar evento analítico:", error_.message);
  }
}

export async function registrarSessionStartSeNovo(sessaoId, usuarioId = null) {
  if (!sessaoId || sessoesConhecidas.has(sessaoId)) return;

  sessoesConhecidas.add(sessaoId);

  try {
    await query(
      `INSERT INTO loja.analytics_eventos (
        evento, sessao_id, usuario_id, ocorrido_em
      )
      SELECT 'session_start', $1, $2, now()
      WHERE NOT EXISTS (
        SELECT 1 FROM loja.analytics_eventos
        WHERE sessao_id = $1 AND evento = 'session_start'
      );`,
      [sessaoId, usuarioId],
    );
  } catch (error_) {
    console.error("Erro ao registrar session_start:", error_.message);
  }
}

export async function analyticsMiddleware(req, res, next) {
  if (req.path === "/health" || req.path === "/api/health") {
    return next();
  }

  const sessaoId = validarSessaoId(req.headers["x-sessao-id"]);
  if (sessaoId) {
    req.sessaoId = sessaoId;
  }

  // Tenta autenticação opcional para atribuir usuarioId a visitantes logados
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const decoded = await auth.verifyIdToken(token);
        req.usuarioId = decoded.uid;
        req.usuarioEmail = decoded.email || "";
      } catch {
        // Ignora erro em rotas públicas ou visitantes
      }
    }
  }

  if (req.sessaoId) {
    // Registra session_start de forma assíncrona sem travar a requisição
    registrarSessionStartSeNovo(req.sessaoId, req.usuarioId || null);
  }

  next();
}
