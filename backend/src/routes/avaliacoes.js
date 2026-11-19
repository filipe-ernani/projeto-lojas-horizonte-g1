import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  listarAvaliacoesPendentesQuery,
  salvarAvaliacaoQuery,
  validarCorpoAvaliacao,
} from "../queries/avaliacoesQueries.js";

const router = Router();

router.get("/avaliacoes/pendentes", requireAuth, async (req, res, next) => {
  try {
    const pendentes = await listarAvaliacoesPendentesQuery(req.usuarioId);
    res.json(pendentes);
  } catch (error_) {
    next(error_);
  }
});

router.put("/avaliacoes/:sku", requireAuth, async (req, res, next) => {
  try {
    const validacao = validarCorpoAvaliacao(req.body);
    if (validacao.erro) {
      return res.status(400).json({ erro: validacao.erro });
    }

    const { sku } = req.params;
    const resultado = await salvarAvaliacaoQuery({
      usuarioId: req.usuarioId,
      emailToken: req.usuarioEmail || null,
      sku,
      nota: validacao.dados.nota,
      comentario: validacao.dados.comentario,
    });

    if (resultado.erro) {
      return res.status(resultado.status || 400).json({ erro: resultado.erro });
    }

    res.status(resultado.criada ? 201 : 200).json(resultado.avaliacao);
  } catch (error_) {
    next(error_);
  }
});

export default router;
