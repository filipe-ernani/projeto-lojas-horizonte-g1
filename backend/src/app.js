import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.js";
import categoriasRouter from "./routes/categorias.js";
import produtosRouter from "./routes/produtos.js";

export const app = express();

const origensPermitidas = new Set(
  (process.env.FRONT_ORIGIN || "http://localhost:5173").split(","),
);

app.use(
  cors({
    origin: (origem, callback) => {
      // Permite requisições sem origin (como curl, postman) ou da lista permitida
      if (!origem || origensPermitidas.has(origem)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissivo para desenvolvimento local
    },
    credentials: true,
  }),
);

app.use(express.json());

// Montagem das rotas públicas da API
app.use("/api", healthRouter);
app.use("/api", categoriasRouter);
app.use("/api", produtosRouter);

// Rota 404 para endpoints não mapeados
app.use((req, res) => {
  res.status(404).json({ erro: "Recurso não encontrado." });
});

// Middleware global de tratamento de erros
// eslint-disable-next-line no-unused-vars
app.use((erro, req, res, next) => {
  console.error("Erro na requisição:", erro);

  const status = erro.status || 500;
  const mensagem =
    status === 500
      ? "Ocorreu um erro interno no servidor."
      : erro.message || "Erro ao processar a requisição.";

  res.status(status).json({ erro: mensagem });
});
