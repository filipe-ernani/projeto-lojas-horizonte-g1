import { auth } from "../firebase.js";

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token de autenticação não fornecido." });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ erro: "Token de autenticação não fornecido." });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.usuarioId = decodedToken.uid;
    req.usuarioEmail = decodedToken.email || "";
    next();
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }
}
