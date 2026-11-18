import { auth } from "../firebase.js";
import { query } from "../db.js";

export const usuariosGarantidos = new Set();

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Token de autenticação não fornecido." });
  }

  const token = authHeader.slice(7).trim();

  if (!token) {
    return res.status(401).json({ erro: "Token de autenticação não fornecido." });
  }

  let decodedToken;
  try {
    if (
      process.env.NODE_ENV !== "production" &&
      (token.startsWith("test:") || token.startsWith("mock:"))
    ) {
      // Suporte a tokens sintéticos para testes automatizados locais: test:uid:email:nome
      const partes = token.split(":");
      const uid = partes[1] || "test-user-id";
      const email = partes[2] || `${uid}@example.com`;
      const nome = partes[3] || "";
      decodedToken = { uid, email, name: nome };
    } else {
      decodedToken = await auth.verifyIdToken(token);
    }
  } catch {
    return res.status(401).json({ erro: "Token inválido ou expirado." });
  }

  const uid = decodedToken.uid;
  const email = decodedToken.email || "";
  const nome = decodedToken.name || "";

  req.usuarioId = uid;
  req.usuarioEmail = email;
  req.usuarioNome = nome;

  if (!usuariosGarantidos.has(uid)) {
    try {
      await query(
        `INSERT INTO loja.usuarios (usuario_id, email, nome)
         VALUES ($1, $2, $3)
         ON CONFLICT (usuario_id) DO NOTHING;`,
        [uid, email, nome],
      );
      usuariosGarantidos.add(uid);
    } catch (dbError) {
      return next(dbError);
    }
  }

  next();
}
