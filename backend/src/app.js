import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import healthRouter from "./routes/health.js";
import categoriasRouter from "./routes/categorias.js";
import produtosRouter from "./routes/produtos.js";
import usuariosRouter from "./routes/usuarios.js";
import enderecosRouter from "./routes/enderecos.js";
import favoritosRouter from "./routes/favoritos.js";
import carrinhoRouter from "./routes/carrinho.js";
import pedidosRouter from "./routes/pedidos.js";
import avaliacoesRouter from "./routes/avaliacoes.js";
import integracaoRouter from "./routes/integracao.js";
import chatRouter from "./routes/chat.js";
import { criarLimitador } from "./middlewares/limitador.js";
import { analyticsMiddleware } from "./services/analyticsService.js";

export const app = express();

app.disable("x-powered-by");

// Confia apenas em proxies da própria máquina ou da rede privada; um cliente
// externo não consegue falsificar o IP pelo cabeçalho X-Forwarded-For
app.set("trust proxy", "loopback, linklocal, uniquelocal");

const origensPermitidas = new Set(
  (process.env.FRONT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origem) => origem.trim())
    .filter(Boolean),
);

// Cabeçalhos básicos de segurança
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  next();
});

app.use("/api", (req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  next();
});

app.use(
  cors({
    origin: (origem, callback) => {
      if (!origem || origensPermitidas.has(origem)) {
        return callback(null, true);
      }
      const erro = new Error("Origem não permitida.");
      erro.status = 403;
      return callback(erro);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type", "X-Sessao-Id", "X-API-Key"],
  }),
);

// Limite de requisições por IP nas rotas mais sensíveis (D13)
app.use(
  "/api/chat",
  criarLimitador({
    janelaMs: 60000,
    maximo: 30,
    mensagem: "Muitas requisições ao assistente. Tente novamente em instantes.",
  }),
);
app.use(
  "/api/integracao",
  criarLimitador({
    janelaMs: 60000,
    maximo: 60,
    mensagem: "Muitas requisições à integração. Tente novamente em instantes.",
  }),
);

// Limite de segurança de 100kb para payload JSON
app.use(express.json({ limit: "100kb" }));

// Middleware de analytics append-only (D-23)
app.use(analyticsMiddleware);

// Montagem das rotas públicas e privadas da API
app.use("/api", healthRouter);
app.use("/api", categoriasRouter);
app.use("/api", produtosRouter);
app.use("/api", usuariosRouter);
app.use("/api", enderecosRouter);
app.use("/api", favoritosRouter);
app.use("/api", carrinhoRouter);
app.use("/api", pedidosRouter);
app.use("/api", avaliacoesRouter);
app.use("/api", integracaoRouter);
app.use("/api", chatRouter);

// Rota 404 JSON padronizada para endpoints /api não mapeados
app.use("/api", (req, res) => {
  res.status(404).json({ erro: "Rota não encontrada." });
});

// Em produção, a própria API entrega o build do front e o fallback da SPA
const dirFront = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../frontend/dist",
);
if (
  process.env.NODE_ENV === "production" &&
  fs.existsSync(path.join(dirFront, "index.html"))
) {
  app.use(express.static(dirFront));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    res.sendFile(path.join(dirFront, "index.html"));
  });
}

// Fallback 404 para qualquer outra rota
app.use((req, res) => {
  res.status(404).json({ erro: "Recurso não encontrado." });
});

function traduzirErro(erro) {
  if (erro.type === "entity.parse.failed") {
    return { status: 400, mensagem: "JSON inválido no corpo da requisição." };
  }
  if (erro.type === "entity.too.large") {
    return { status: 413, mensagem: "Corpo da requisição acima do limite de 100 KB." };
  }
  // 22021: texto com byte inválido para o banco, como o caractere nulo
  if (erro.code === "22021") {
    return { status: 400, mensagem: "Parâmetro com caractere inválido." };
  }

  const status = Number(erro.status);
  if (status >= 400 && status < 500) {
    return { status, mensagem: erro.message || "Erro na requisição." };
  }
  return { status: 500, mensagem: "Erro interno." };
}

// Middleware global de erros (nunca expõe stack trace em erro 500)
// eslint-disable-next-line no-unused-vars
app.use((erro, req, res, next) => {
  const { status, mensagem } = traduzirErro(erro);

  if (status === 500) {
    console.error("Erro interno no servidor:", {
      tipo: erro.name,
      codigo: erro.code ?? null,
      mensagem: erro.message,
    });
  }

  res.status(status).json({ erro: mensagem });
});
