import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  adicionarFavoritoQuery,
  listarFavoritosQuery,
  removerFavoritoQuery,
} from "../queries/favoritosQueries.js";

const router = Router();

router.get("/favoritos", requireAuth, async (req, res, next) => {
  try {
    const favoritos = await listarFavoritosQuery(req.usuarioId);
    res.json(favoritos);
  } catch (error_) {
    next(error_);
  }
});

router.put("/favoritos/:produtoId", requireAuth, async (req, res, next) => {
  try {
    const sku = req.params.produtoId;
    const resultado = await adicionarFavoritoQuery(
      req.usuarioId,
      req.usuarioEmail,
      sku,
    );

    if (!resultado.ok && resultado.motivo === "PRODUTO_NAO_ENCONTRADO") {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    res.status(204).send();
  } catch (error_) {
    next(error_);
  }
});

router.delete("/favoritos/:produtoId", requireAuth, async (req, res, next) => {
  try {
    const sku = req.params.produtoId;
    await removerFavoritoQuery(req.usuarioId, sku);
    res.status(204).send();
  } catch (error_) {
    next(error_);
  }
});

export default router;
