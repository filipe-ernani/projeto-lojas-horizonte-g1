import { Router } from "express";
import { listarCategoriasQuery } from "../queries/produtosQueries.js";

const router = Router();

router.get("/categorias", async (req, res, next) => {
  try {
    const categorias = await listarCategoriasQuery();
    res.json(categorias);
  } catch (error_) {
    next(error_);
  }
});

export default router;
