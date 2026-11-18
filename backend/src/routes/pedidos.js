import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  cancelarPedidoQuery,
  listarMeusPedidosQuery,
} from "../queries/pedidosQueries.js";
import { paraIdSeguro } from "../utils/validacao.js";

const router = Router();

router.get("/pedidos/meus", requireAuth, async (req, res, next) => {
  try {
    const pedidos = await listarMeusPedidosQuery(req.usuarioId);
    res.json(pedidos);
  } catch (error_) {
    next(error_);
  }
});

router.post("/pedidos/:id/cancelar", requireAuth, async (req, res, next) => {
  try {
    const id = paraIdSeguro(req.params.id);
    if (id === null) {
      return res.status(404).json({ erro: "Pedido não encontrado." });
    }

    const resultado = await cancelarPedidoQuery(id, req.usuarioId);
    if (!resultado.sucesso) {
      return res.status(resultado.status || 400).json({ erro: resultado.erro });
    }

    res.json({
      ok: true,
      id,
      status: resultado.status,
      canceladoEm: resultado.canceladoEm || null,
      dataLocal: resultado.dataLocal || null,
    });
  } catch (error_) {
    next(error_);
  }
});

export default router;
