import { Router } from "express";
import {
  buscarProdutoPorSkuQuery,
  buscarSemelhantesQuery,
  listarProdutosQuery,
} from "../queries/produtosQueries.js";

const router = Router();

router.get("/produtos", async (req, res, next) => {
  try {
    const {
      categoria,
      busca,
      tamanho,
      precoMin,
      precoMax,
      pagina,
      limite,
      ordenar,
    } = req.query;

    const resultado = await listarProdutosQuery({
      categoria,
      busca,
      tamanho,
      precoMin,
      precoMax,
      pagina,
      limite,
      ordenar,
    });

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
    const { id } = req.params;
    const produto = await buscarProdutoPorSkuQuery(id);

    if (!produto) {
      return res.status(404).json({ erro: "Produto não encontrado." });
    }

    // Não há avaliações reais registradas para o catálogo; estrutura padronizada
    res.json({
      resumo: {
        notaMedia: null,
        total: 0,
        distribuicao: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
      itens: [],
    });
  } catch (error_) {
    next(error_);
  }
});

export default router;
