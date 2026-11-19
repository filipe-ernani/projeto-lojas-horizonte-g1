import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  buscarMinhaAvaliacaoQuery,
  listarAvaliacoesProdutoQuery,
  validarPaginacaoAvaliacoes,
} from "../queries/avaliacoesQueries.js";
import {
  buscarProdutoPorSkuQuery,
  buscarSemelhantesQuery,
  listarProdutosQuery,
  validarFiltrosProdutos,
} from "../queries/produtosQueries.js";
import { gravarEvento } from "../services/analyticsService.js";

const router = Router();

router.get("/produtos", async (req, res, next) => {
  try {
    const validacao = validarFiltrosProdutos(req.query);
    if (validacao.erro) {
      return res.status(400).json({ erro: validacao.erro });
    }

    const resultado = await listarProdutosQuery(validacao.dados);

    res.json(resultado);
  } catch (error_) {
    next(error_);
  }
});

router.get("/produtos/:id", async (req, res, next) => {
  try {
    const { id } = req.params; // Decisão D-22: id público é o SKU
    const produto = await buscarProdutoPorSkuQuery(id);

    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    if (req.sessaoId) {
      void gravarEvento({
        evento: "view_product",
        sessaoId: req.sessaoId,
        usuarioId: req.usuarioId || null,
        sku: produto.sku,
      });
    }

    res.json(produto);
  } catch (error_) {
    next(error_);
  }
});

router.get("/produtos/:id/semelhantes", async (req, res, next) => {
  try {
    const { id } = req.params;
    const produto = await buscarProdutoPorSkuQuery(id);

    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    const semelhantes = await buscarSemelhantesQuery(
      produto.sku,
      produto.categoria,
      4,
    );
    res.json(semelhantes);
  } catch (error_) {
    next(error_);
  }
});

router.get("/produtos/:id/avaliacoes", async (req, res, next) => {
  try {
    const validacao = validarPaginacaoAvaliacoes(req.query);
    if (validacao.erro) {
      return res.status(400).json({ erro: validacao.erro });
    }

    const { id } = req.params;
    const resultado = await listarAvaliacoesProdutoQuery(id, validacao.dados);

    if (!resultado) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    res.json(resultado);
  } catch (error_) {
    next(error_);
  }
});

router.get("/produtos/:id/avaliacoes/minha", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const resultado = await buscarMinhaAvaliacaoQuery(req.usuarioId, id);

    if (!resultado) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    res.json(resultado);
  } catch (error_) {
    next(error_);
  }
});

export default router;
