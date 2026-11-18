import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  atualizarEnderecoQuery,
  criarEnderecoQuery,
  deletarEnderecoQuery,
  listarEnderecosQuery,
  validarDadosEndereco,
} from "../queries/enderecosQueries.js";
import { paraIdSeguro } from "../utils/validacao.js";

const router = Router();

router.get("/enderecos", requireAuth, async (req, res, next) => {
  try {
    const enderecos = await listarEnderecosQuery(req.usuarioId);
    res.json(enderecos);
  } catch (error_) {
    next(error_);
  }
});

router.post("/enderecos", requireAuth, async (req, res, next) => {
  try {
    const validacao = validarDadosEndereco(req.body);
    if (!validacao.valido) {
      return res.status(400).json({ erro: validacao.erro });
    }

    const endereco = await criarEnderecoQuery(
      req.usuarioId,
      req.usuarioEmail,
      validacao.dados,
    );
    res.status(201).json(endereco);
  } catch (error_) {
    next(error_);
  }
});

router.put("/enderecos/:id", requireAuth, async (req, res, next) => {
  try {
    const id = paraIdSeguro(req.params.id);
    if (id === null) {
      return res.status(404).json({ erro: "Endereço não encontrado." });
    }

    const validacao = validarDadosEndereco(req.body);
    if (!validacao.valido) {
      return res.status(400).json({ erro: validacao.erro });
    }

    const endereco = await atualizarEnderecoQuery(
      id,
      req.usuarioId,
      validacao.dados,
    );

    if (!endereco) {
      return res.status(404).json({ erro: "Endereço não encontrado." });
    }

    res.json(endereco);
  } catch (error_) {
    next(error_);
  }
});

router.delete("/enderecos/:id", requireAuth, async (req, res, next) => {
  try {
    const id = paraIdSeguro(req.params.id);
    if (id === null) {
      return res.status(404).json({ erro: "Endereço não encontrado." });
    }

    const deletado = await deletarEnderecoQuery(id, req.usuarioId);
    if (!deletado) {
      return res.status(404).json({ erro: "Endereço não encontrado." });
    }

    res.status(204).send();
  } catch (error_) {
    next(error_);
  }
});

export default router;
