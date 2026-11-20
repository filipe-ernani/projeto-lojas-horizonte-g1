import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  obterCarrinhoQuery,
  substituirCarrinhoQuery,
} from "../queries/carrinhoQueries.js";
import { finalizarCarrinhoQuery } from "../queries/pedidosQueries.js";
import { registrarBeginCheckoutSeNovo } from "../services/analyticsService.js";

const router = Router();

router.get("/carrinho", requireAuth, async (req, res, next) => {
  try {
    const carrinho = await obterCarrinhoQuery(req.usuarioId);
    res.json(carrinho);
  } catch (error_) {
    next(error_);
  }
});

router.put("/carrinho", requireAuth, async (req, res, next) => {
  try {
    const resultado = await substituirCarrinhoQuery(
      req.usuarioId,
      req.usuarioEmail,
      req.body || {},
      req.sessaoId || null,
    );

    if (!resultado.sucesso) {
      return res.status(resultado.status || 400).json({ erro: resultado.erro });
    }

    res.json(resultado.carrinho);
  } catch (error_) {
    next(error_);
  }
});

router.post("/checkout/iniciado", requireAuth, async (req, res, next) => {
  try {
    if (!req.sessaoId) {
      return res
        .status(400)
        .json({ erro: "Cabeçalho X-Sessao-Id ausente ou inválido." });
    }

    const carrinho = await obterCarrinhoQuery(req.usuarioId);
    if (carrinho.itens.length === 0) {
      return res.status(400).json({ erro: "Carrinho está vazio." });
    }

    await registrarBeginCheckoutSeNovo({
      sessaoId: req.sessaoId,
      usuarioId: req.usuarioId,
      valor: carrinho.subtotal,
    });

    res.status(204).send();
  } catch (error_) {
    next(error_);
  }
});

router.post("/carrinho/finalizar", requireAuth, async (req, res, next) => {
  try {
    // Só estes campos são lidos: dados de cartão enviados no corpo são ignorados
    const { enderecoId, formaPagamento, parcelas } = req.body || {};
    const resultado = await finalizarCarrinhoQuery(
      req.usuarioId,
      { enderecoId, formaPagamento, parcelas },
      req.sessaoId || null,
    );

    if (!resultado.sucesso) {
      return res.status(resultado.status || 400).json({ erro: resultado.erro });
    }

    res.status(201).json(resultado.pedido);
  } catch (error_) {
    next(error_);
  }
});

export default router;
