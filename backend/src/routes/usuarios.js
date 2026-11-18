import { Router } from "express";
import { requireAuth } from "../middlewares/auth.js";
import {
  buscarPerfilQuery,
  upsertPerfilQuery,
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
    const { nome, telefone } = req.body || {};
    const perfil = await upsertPerfilQuery(req.usuarioId, req.usuarioEmail, {
      nome: typeof nome === "string" ? nome.trim() : (nome === undefined ? undefined : ""),
      telefone: typeof telefone === "string" ? telefone.trim() : (telefone === undefined ? undefined : ""),
    });
    res.json(perfil);
  } catch (error_) {
    next(error_);
  }
});

export default router;
