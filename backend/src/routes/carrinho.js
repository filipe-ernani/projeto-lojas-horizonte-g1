import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  obterCarrinhoQuery,
  substituirCarrinhoQuery,
} from "../queries/carrinhoQueries.js";
import { finalizarCarrinhoQuery } from "../queries/pedidosQueries.js";

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

router.post("/carrinho/finalizar", requireAuth, async (req, res, next) => {
  try {
    const { enderecoId, formaPagamento } = req.body || {};
    const resultado = await finalizarCarrinhoQuery(
      req.usuarioId,
      { enderecoId, formaPagamento },
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
