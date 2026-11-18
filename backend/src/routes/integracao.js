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
  "parcelas",
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

const LIMITE_PADRAO = 5000;
const LIMITE_MAXIMO = 20000;
const REGEX_DATA_ISO =
  /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/;

function dataIsoValida(valor) {
  const partes = typeof valor === "string" ? REGEX_DATA_ISO.exec(valor) : null;
  if (!partes || Number.isNaN(new Date(valor).getTime())) return false;

  // Recusa datas inexistentes, como 2026-02-31
  const [ano, mes, dia] = partes.slice(1, 4).map(Number);
  const calendario = new Date(Date.UTC(ano, mes - 1, dia));
  return calendario.getUTCMonth() === mes - 1 && calendario.getUTCDate() === dia;
}

function validarParametros(req, res, next) {
  const { desde, limite, formato } = req.query;

  if (desde !== undefined && !dataIsoValida(desde)) {
    return res.status(400).json({
      erro: "Parâmetro 'desde' inválido. Use uma data ISO 8601, como 2026-01-31T12:00:00Z.",
    });
  }

  const limiteValido =
    typeof limite === "string" &&
    /^\d+$/.test(limite) &&
    Number(limite) >= 1 &&
    Number(limite) <= LIMITE_MAXIMO;

  if (limite !== undefined && !limiteValido) {
    return res.status(400).json({
      erro: `Parâmetro 'limite' inválido. Use um número inteiro entre 1 e ${LIMITE_MAXIMO}.`,
    });
  }

  res.locals.parametros = {
    desde,
    limite: limite === undefined ? LIMITE_PADRAO : Number(limite),
    formato,
  };
  next();
}

router.get("/integracao/pedidos", requireApiKey, validarParametros, async (req, res, next) => {
  try {
    const { desde, limite, formato } = res.locals.parametros;
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

router.get("/integracao/pedido-itens", requireApiKey, validarParametros, async (req, res, next) => {
  try {
    const { desde, limite, formato } = res.locals.parametros;
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

router.get("/integracao/eventos", requireApiKey, validarParametros, async (req, res, next) => {
  try {
    const { desde, limite, formato } = res.locals.parametros;
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
