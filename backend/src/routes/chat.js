import crypto from "node:crypto";
import { Router } from "express";
import { autenticacaoOpcional } from "../middlewares/auth.js";
import { query } from "../db.js";
import { gerarUsuarioHash } from "../queries/avaliacoesQueries.js";
import { AdkErro, MENSAGENS_ADK, lerConfigAdk, perguntarAoAgente } from "../services/adkClient.js";

const router = Router();

const LIMITE_MENSAGENS_POR_MINUTO = 20;
const JANELA_MS = 60000;
const TAMANHO_MAXIMO_MENSAGEM = 500;
const MAXIMO_PRODUTOS = 4;
const PADRAO_SKU = /^HZ-[A-Z]{3}-\d{3}$/;
const PADRAO_SKU_NO_TEXTO = /\bHZ-[A-Z]{3}-\d{3}\b/g;
const PADRAO_SESSAO = /^[A-Za-z0-9_-]{1,64}$/;
const MENSAGEM_LIMITE = "Muitas mensagens em pouco tempo. Aguarde um instante.";

// Limite por usuário (ou por sessão do visitante), em memória
const historicoPorChave = new Map();

setInterval(() => {
  const inicio = Date.now() - JANELA_MS;
  for (const [chave, tempos] of historicoPorChave) {
    if (!tempos.some((t) => t > inicio)) historicoPorChave.delete(chave);
  }
}, JANELA_MS).unref();

function checarRateLimit(chave) {
  const agora = Date.now();
  const validos = (historicoPorChave.get(chave) || []).filter((t) => t > agora - JANELA_MS);
  if (validos.length >= LIMITE_MENSAGENS_POR_MINUTO) return false;
  validos.push(agora);
  historicoPorChave.set(chave, validos);
  return true;
}

function erro400(res, mensagem) {
  return res.status(400).json({ erro: mensagem });
}

async function buscarNomeProduto(sku) {
  const resultado = await query("SELECT nome FROM loja.produtos WHERE sku = $1 LIMIT 1;", [sku]);
  return resultado.rows[0]?.nome ?? null;
}

/**
 * SKUs do catálogo citados no texto que existem no banco, na ordem em que
 * aparecem, sem repetir e no máximo 4.
 */
async function extrairProdutos(texto) {
  const candidatos = [...new Set(texto.match(PADRAO_SKU_NO_TEXTO) || [])].slice(0, 20);
  if (candidatos.length === 0) return [];
  const resultado = await query("SELECT sku FROM loja.produtos WHERE sku = ANY($1::text[]);", [
    candidatos,
  ]);
  const existentes = new Set(resultado.rows.map((linha) => linha.sku));
  return candidatos.filter((sku) => existentes.has(sku)).slice(0, MAXIMO_PRODUTOS);
}

router.post("/chat", autenticacaoOpcional, async (req, res, next) => {
  const { mensagem, sessaoId: sessaoRecebida, contexto } = req.body || {};

  if (typeof mensagem !== "string") {
    return erro400(res, "Mensagem inválida. Escreva entre 1 e 500 caracteres.");
  }
  const texto = mensagem.trim();
  if (texto.length === 0 || texto.length > TAMANHO_MAXIMO_MENSAGEM || texto.includes("\u0000")) {
    return erro400(res, "Mensagem inválida. Escreva entre 1 e 500 caracteres.");
  }

  let sessaoId = sessaoRecebida;
  if (sessaoId === undefined || sessaoId === null) {
    sessaoId = crypto.randomUUID();
  } else if (typeof sessaoId !== "string" || !PADRAO_SESSAO.test(sessaoId)) {
    return erro400(
      res,
      "Sessão inválida. Use até 64 caracteres entre letras, números, hífen e sublinhado.",
    );
  }

  let sku = null;
  if (contexto !== undefined && contexto !== null) {
    if (typeof contexto !== "object" || Array.isArray(contexto)) {
      return erro400(res, "Contexto inválido.");
    }
    if (contexto.sku !== undefined && contexto.sku !== null) {
      if (typeof contexto.sku !== "string" || !PADRAO_SKU.test(contexto.sku)) {
        return erro400(res, "Produto do contexto inválido.");
      }
      sku = contexto.sku;
    }
  }

  const chaveLimite = req.usuarioId ? `u:${req.usuarioId}` : `v:${sessaoId}`;
  if (!checarRateLimit(chaveLimite)) {
    return res.status(429).json({ erro: MENSAGEM_LIMITE });
  }

  try {
    let textoAgente = texto;
    if (sku) {
      const nome = await buscarNomeProduto(sku);
      if (!nome) {
        return erro400(res, "Produto do contexto não encontrado.");
      }
      textoAgente = `[Contexto: o cliente está vendo o produto ${nome}.]\n${texto}`;
    }

    const config = lerConfigAdk();
    if (!config) {
      return res.status(503).json({ erro: MENSAGENS_ADK.indisponivel });
    }

    // Ao agente vai só um identificador opaco: nunca e-mail, nome ou UID do Firebase
    const userId = req.usuarioId ? gerarUsuarioHash(req.usuarioId) : `visitante-${sessaoId}`;

    const resposta = await perguntarAoAgente({
      config,
      userId,
      sessionId: sessaoId,
      texto: textoAgente,
    });

    const produtos = await extrairProdutos(resposta);
    return res.json({ resposta, sessaoId, produtos });
  } catch (erro) {
    if (erro instanceof AdkErro) {
      // Só o status e um código técnico curto; nunca texto, URL ou eventos
      console.error("Falha no assistente:", { status: erro.status, codigo: erro.codigo });
      return res.status(erro.status).json({ erro: erro.message });
    }
    return next(erro);
  }
});

export default router;
