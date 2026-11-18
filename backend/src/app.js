import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.js";
import categoriasRouter from "./routes/categorias.js";
import produtosRouter from "./routes/produtos.js";
import usuariosRouter from "./routes/usuarios.js";
import enderecosRouter from "./routes/enderecos.js";
import favoritosRouter from "./routes/favoritos.js";

export const app = express();

const origensPermitidas = new Set(
  (process.env.FRONT_ORIGIN || "http://localhost:5173").split(","),
);

app.use(
  cors({
    origin: (origem, callback) => {
      if (!origem || origensPermitidas.has(origem)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissivo para desenvolvimento local
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Sessao-Id"],
  }),
);

// Limite de segurança de 100kb para payload JSON
app.use(express.json({ limit: "100kb" }));

// Montagem das rotas públicas e privadas da API
app.use("/api", healthRouter);
app.use("/api", categoriasRouter);
app.use("/api", produtosRouter);
app.use("/api", usuariosRouter);
app.use("/api", enderecosRouter);
app.use("/api", favoritosRouter);

// Rota 404 JSON padronizada para endpoints /api não mapeados
app.use("/api", (req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

// Fallback 404 para qualquer outra rota
app.use((req, res) => {
  res.status(404).json({ erro: "Recurso não encontrado." });
});

// Middleware global de erros (nunca expõe stack trace em erro 500)
// eslint-disable-next-line no-unused-vars
app.use((erro, req, res, next) => {
  console.error("Erro interno no servidor:", erro);

  const status = Number(erro.status) || 500;
  if (status === 500) {
    return res.status(500).json({ erro: "Erro interno." });
  }

  res.status(status).json({ erro: erro.message || "Erro na requisição." });
});
