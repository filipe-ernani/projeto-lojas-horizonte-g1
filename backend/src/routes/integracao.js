import { Router } from "express";
import { requireApiKey } from "../middlewares/authIntegracao.js";
import {
  converterParaCsv,
  exportarEventosQuery,
  exportarPedidoItensQuery,
  exportarPedidosQuery,
} from "../queries/integracaoQueries.js";

const router = Router();

const COLUNAS_PEDIDOS = [
  "pedido_id",
  "usuario_hash",
  "status",
  "forma_pagamento",
  "subtotal",
  "frete",
  "valor_total",
  "finalizado_em",
  "cancelado_em",
  "updated_at",
  "origem",
];

const COLUNAS_PEDIDO_ITENS = [
  "item_id",
  "pedido_id",
  "sku",
  "quantidade",
  "preco_unitario",
  "tamanho",
  "cor",
  "updated_at",
  "origem",
];

const COLUNAS_EVENTOS = [
  "evento_id",
  "evento",
  "ocorrido_em",
  "sessao_id",
  "usuario_hash",
  "sku",
  "quantidade",
  "valor",
  "pedido_id",
  "updated_at",
  "origem",
];

function extrairParametros(req) {
  const { desde, limite, formato } = req.query;
  const numLimite = Math.min(20000, Math.max(1, Number(limite) || 5000));
  return { desde, limite: numLimite, formato };
}

router.get("/integracao/pedidos", requireApiKey, async (req, res, next) => {
  try {
    const { desde, limite, formato } = extrairParametros(req);
    const resultado = await exportarPedidosQuery(desde, limite);

    if (formato === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      return res.send(converterParaCsv(COLUNAS_PEDIDOS, resultado.itens));
    }

    res.json(resultado);
  } catch (error_) {
    next(error_);
  }
});

router.get("/integracao/pedido-itens", requireApiKey, async (req, res, next) => {
  try {
    const { desde, limite, formato } = extrairParametros(req);
    const resultado = await exportarPedidoItensQuery(desde, limite);

    if (formato === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      return res.send(converterParaCsv(COLUNAS_PEDIDO_ITENS, resultado.itens));
    }

    res.json(resultado);
  } catch (error_) {
    next(error_);
  }
});

router.get("/integracao/eventos", requireApiKey, async (req, res, next) => {
  try {
    const { desde, limite, formato } = extrairParametros(req);
    const resultado = await exportarEventosQuery(desde, limite);

    if (formato === "csv") {
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      return res.send(converterParaCsv(COLUNAS_EVENTOS, resultado.itens));
    }

    res.json(resultado);
  } catch (error_) {
    next(error_);
  }
});

export default router;
