import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  buscarPerfilQuery,
  upsertPerfilQuery,
  validarDadosPerfil,
} from "../queries/usuariosQueries.js";

const router = Router();

router.get("/usuarios/perfil", requireAuth, async (req, res, next) => {
  try {
    const perfil = await buscarPerfilQuery(req.usuarioId, req.usuarioEmail);
    res.json(perfil);
  } catch (error_) {
    next(error_);
  }
});

router.put("/usuarios/perfil", requireAuth, async (req, res, next) => {
  try {
    const validacao = validarDadosPerfil(req.body || {});
    if (!validacao.valido) {
      return res.status(400).json({ erro: validacao.erro });
    }

    const perfil = await upsertPerfilQuery(
      req.usuarioId,
      req.usuarioEmail,
      validacao.dados,
    );
    res.json(perfil);
  } catch (error_) {
    next(error_);
  }
});

export default router;
