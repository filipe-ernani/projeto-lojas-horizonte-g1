import { pool } from "../db.js";
import { auth } from "../firebase.js";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Sessões que já têm session_start confirmado no banco (só evita consultas repetidas)
const sessoesConhecidas = new Set();
const LIMITE_SESSOES_CONHECIDAS = 50000;

export function validarSessaoId(header) {
  if (typeof header === "string" && UUID_REGEX.test(header.trim())) {
    return header.trim();
  }
  return null;
}

function lembrarSessao(sessaoId) {
  if (sessoesConhecidas.size >= LIMITE_SESSOES_CONHECIDAS) sessoesConhecidas.clear();
  sessoesConhecidas.add(sessaoId);
}

/**
 * Trava a sessão até o fim da transação: eventos da mesma sessão são gravados
 * um de cada vez, o que garante o session_start primeiro e evita duplicidade.
 */
async function travarSessao(client, sessaoId) {
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0));", [
    `sessao:${sessaoId}`,
  ]);
}

/**
 * Grava session_start se a sessão ainda não tiver um. Exige a trava da sessão.
 * clock_timestamp() (e não now()) mantém a ordem dos eventos da mesma transação.
 */
async function garantirSessionStart(client, sessaoId, usuarioId) {
  await client.query(
    `INSERT INTO loja.analytics_eventos (evento, sessao_id, usuario_id, ocorrido_em)
     SELECT 'session_start', $1::text, $2::text, clock_timestamp()
     WHERE NOT EXISTS (
       SELECT 1 FROM loja.analytics_eventos
       WHERE sessao_id = $1::text AND evento = 'session_start'
     );`,
    [sessaoId, usuarioId],
  );
}

async function inserirEvento(client, { evento, sessaoId, usuarioId, sku, quantidade, valor, pedidoId }) {
  await client.query(
    `INSERT INTO loja.analytics_eventos (
       evento, sessao_id, usuario_id, sku, quantidade, valor, pedido_id, ocorrido_em
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, clock_timestamp());`,
    [evento, sessaoId, usuarioId, sku, quantidade, valor, pedidoId],
  );
}

/** Executa `fn` numa transação própria; falha de analytics nunca derruba a requisição. */
async function emTransacao(rotulo, fn) {
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN;");
    const resultado = await fn(client);
    await client.query("COMMIT;");
    return resultado;
  } catch (error_) {
    if (client) await client.query("ROLLBACK;").catch(() => {});
    console.error(`Erro ao registrar ${rotulo}:`, error_.message);
    return false;
  } finally {
    client?.release();
  }
}

/**
 * Grava um evento do funil (view_product, add_to_cart). Se for o primeiro
 * evento da sessão, grava session_start antes dele na mesma transação.
 */
export async function gravarEvento({
  evento,
  sessaoId,
  usuarioId = null,
  sku = null,
  quantidade = null,
  valor = null,
  pedidoId = null,
}) {
  if (!sessaoId) return false;

  const gravado = await emTransacao(evento, async (client) => {
    await travarSessao(client, sessaoId);
    await garantirSessionStart(client, sessaoId, usuarioId);
    await inserirEvento(client, { evento, sessaoId, usuarioId, sku, quantidade, valor, pedidoId });
    return true;
  });
  if (gravado) lembrarSessao(sessaoId);
  return gravado;
}

/**
 * Grava begin_checkout uma única vez por sessão (com session_start antes, se faltar).
 * Como a sessão termina a cada compra, cada compra tem o próprio begin_checkout.
 */
export async function registrarBeginCheckoutSeNovo({
  sessaoId,
  usuarioId = null,
  valor = null,
}) {
  if (!sessaoId) return false;

  return emTransacao("begin_checkout", async (client) => {
    await travarSessao(client, sessaoId);
    await garantirSessionStart(client, sessaoId, usuarioId);
    const resultado = await client.query(
      `INSERT INTO loja.analytics_eventos (evento, sessao_id, usuario_id, valor, ocorrido_em)
       SELECT 'begin_checkout', $1::text, $2::text, $3::numeric, clock_timestamp()
       WHERE NOT EXISTS (
         SELECT 1 FROM loja.analytics_eventos
         WHERE sessao_id = $1::text AND evento = 'begin_checkout'
       );`,
      [sessaoId, usuarioId, valor],
    );
    lembrarSessao(sessaoId);
    return resultado.rowCount > 0;
  });
}

/**
 * Funil da compra DENTRO da transação que finaliza o pedido (o chamador faz o
 * BEGIN/COMMIT): session_start e begin_checkout se faltarem, depois purchase.
 * Se a transação falhar, nenhum desses eventos fica. Não duplica purchase do
 * mesmo pedido, mesmo se a finalização for reenviada.
 */
export async function registrarCompraNaTransacao(
  client,
  { sessaoId, usuarioId = null, pedidoId, valorTotal, valorCheckout = null },
) {
  await travarSessao(client, sessaoId);
  await garantirSessionStart(client, sessaoId, usuarioId);
  await client.query(
    `INSERT INTO loja.analytics_eventos (evento, sessao_id, usuario_id, valor, ocorrido_em)
     SELECT 'begin_checkout', $1::text, $2::text, $3::numeric, clock_timestamp()
     WHERE NOT EXISTS (
       SELECT 1 FROM loja.analytics_eventos
       WHERE sessao_id = $1::text AND evento = 'begin_checkout'
     );`,
    [sessaoId, usuarioId, valorCheckout],
  );
  await client.query(
    `INSERT INTO loja.analytics_eventos (evento, sessao_id, usuario_id, valor, pedido_id, ocorrido_em)
     SELECT 'purchase', $1::text, $2::text, $3::numeric, $4::bigint, clock_timestamp()
     WHERE NOT EXISTS (
       SELECT 1 FROM loja.analytics_eventos
       WHERE evento = 'purchase' AND pedido_id = $4::bigint
     );`,
    [sessaoId, usuarioId, valorTotal, pedidoId],
  );
}

export async function registrarSessionStartSeNovo(sessaoId, usuarioId = null) {
  if (!sessaoId || sessoesConhecidas.has(sessaoId)) return;

  // A sessão só é lembrada depois de gravar: se falhar, a próxima requisição tenta de novo
  const gravado = await emTransacao("session_start", async (client) => {
    await travarSessao(client, sessaoId);
    await garantirSessionStart(client, sessaoId, usuarioId);
    return true;
  });
  if (gravado) lembrarSessao(sessaoId);
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
    // Assíncrono: a trava por sessão garante que session_start vem antes do evento da rota
    void registrarSessionStartSeNovo(req.sessaoId, req.usuarioId || null);
  }

  next();
}
