/**
 * seed-simulado.js
 *
 * Gerador de dados SIMULADOS para o dashboard de BI da Lojas Horizonte.
 * Simula carrinhos de compra, etapas de abandono, conversão em pedidos e cancelamentos.
 *
 * Utiliza apenas bibliotecas nativas do Node.js (fs, path, crypto).
 * Todos os registros gerados possuem a coluna `origem: SIMULADO`.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// 1. Configurações de cores e tamanhos
const MAPA_CORES_HEX = {
  Preto: "#000000",
  Marrom: "#8B4513",
  Vinho: "#800020",
  Verde: "#2E8B57",
  Bege: "#F5F5DC",
  Rosa: "#FFC0CB",
  "Off-white": "#FAF9F6",
  Cinza: "#808080",
  Azul: "#1E90FF",
  Branco: "#FFFFFF",
};

const CORES_VALIDAS = Object.keys(MAPA_CORES_HEX);

const TAMANHOS_POR_CATEGORIA = {
  Calçados: ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"],
  Feminino: ["PP", "P", "M", "G", "GG"],
  Masculino: ["PP", "P", "M", "G", "GG"],
  Esporte: ["PP", "P", "M", "G", "GG"],
  "Moda íntima e praia": ["PP", "P", "M", "G", "GG"],
  Infantil: ["2", "4", "6", "8", "10", "12"],
  Acessórios: ["Único"],
  Casa: ["Único"],
  Beleza: ["Único"],
};

const FORMAS_PAGAMENTO = ["PIX", "CARTAO", "BOLETO"];

// 2. Leitura de parâmetros (variáveis de ambiente ou argumentos de CLI)
function obterParametro(nome, valorPadrao) {
  if (process.env[nome] !== undefined) {
    const val = process.env[nome];
    return typeof valorPadrao === "number" ? Number(val) : val;
  }
  const arg = process.argv.find(
    (a) =>
      a.toLowerCase().startsWith(`--${nome.toLowerCase()}=`) ||
      a.toLowerCase().startsWith(`${nome.toLowerCase()}=`),
  );
  if (arg) {
    const val = arg.split("=")[1];
    return typeof valorPadrao === "number" ? Number(val) : val;
  }
  return valorPadrao;
}

const DIAS = obterParametro("DIAS", 90);
const CARRINHOS = obterParametro("CARRINHOS", 5000);
const TAXA_CONVERSAO = obterParametro("TAXA_CONVERSAO", 0.03);
const TAXA_CANCELAMENTO = obterParametro("TAXA_CANCELAMENTO", 0.05);
const SEMENTE = obterParametro("SEMENTE", 42);

// 3. PRNG determinístico Mulberry32
function criarPRNG(semente) {
  let s = Number(semente) >>> 0;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 4. Localização de caminhos da raiz
function encontrarRaiz() {
  let atual = __dirname;
  while (atual !== path.dirname(atual)) {
    if (fs.existsSync(path.join(atual, "data", "catalogo.csv"))) {
      return atual;
    }
    atual = path.dirname(atual);
  }
  return path.resolve(__dirname, "..", "..");
}

const raizProjeto = encontrarRaiz();
const caminhoCatalogo = path.join(raizProjeto, "data", "catalogo.csv");
const dirSaida = path.join(raizProjeto, "data", "saida");

// Verificação estrita de catálogo
if (!fs.existsSync(caminhoCatalogo)) {
  console.error(`ERRO: Arquivo ${caminhoCatalogo} não encontrado.`);
  console.error("Conforme as regras, o script NÃO inventa produtos. Abortando.");
  process.exit(1);
}

// 5. Funções auxiliares de negócio
function extrairCor(nome, categoria) {
  if (categoria === "Beleza") {
    return "";
  }
  const ultimaPalavra = nome.trim().split(/\s+/).pop();
  return CORES_VALIDAS.includes(ultimaPalavra) ? ultimaPalavra : "";
}

function obterTamanhosValidos(categoria) {
  return TAMANHOS_POR_CATEGORIA[categoria] || ["Único"];
}

function gerarDescricao(nome, categoria) {
  return `${nome}, peça selecionada da categoria ${categoria} com design atemporal, conforto e estilo Horizonte.`;
}

function gerarUsuarioHash(id) {
  return crypto
    .createHash("sha256")
    .update(`usuario_sintetico_horizonte_${id}`)
    .digest("hex")
    .substring(0, 16);
}

// Distribuição de data com maior movimento aos fins de semana
function sortearData(prng, instanteFim, diasJanela) {
  let tentativa = 0;
  while (tentativa < 100) {
    tentativa++;
    const diasAtras = prng() * diasJanela;
    const msAtras = diasAtras * 24 * 60 * 60 * 1000;
    const data = new Date(instanteFim.getTime() - msAtras);
    const diaSemana = data.getUTCDay(); // 0 = Domingo, 6 = Sábado
    let peso = 1.0;
    if (diaSemana === 0 || diaSemana === 6) {
      peso = 1.9; // Fim de semana tem maior tráfego
    } else if (diaSemana === 5) {
      peso = 1.4; // Sexta-feira
    }
    if (prng() * 2.0 <= peso) {
      return data;
    }
  }
  return new Date(
    instanteFim.getTime() - prng() * diasJanela * 24 * 60 * 60 * 1000,
  );
}

// 6. Carga do Catálogo
const conteudoCatalogo = fs.readFileSync(caminhoCatalogo, "utf-8").trim();
const linhasCatalogo = conteudoCatalogo.split(/\r?\n/);
const produtos = [];

for (let i = 1; i < linhasCatalogo.length; i++) {
  const linha = linhasCatalogo[i].trim();
  if (!linha) continue;
  const colunas = linha.split(",");
  const sku = colunas[0].trim();
  const nome = colunas[1].trim();
  const modelo = colunas[2].trim();
  const categoria = colunas[3].trim();
  const grupo = colunas[4].trim();
  const preco = parseFloat(colunas[5].trim());
  const custo = parseFloat(colunas[6].trim());
  const popularidade = parseFloat(colunas[7].trim());

  produtos.push({
    sku,
    nome,
    modelo,
    categoria,
    grupo,
    preco,
    custo,
    popularidade,
    cor: extrairCor(nome, categoria),
    tamanhos: obterTamanhosValidos(categoria),
  });
}

if (produtos.length === 0) {
  console.error("ERRO: Nenhum produto válido encontrado no catálogo.");
  process.exit(1);
}

// 7. Preparação da amostragem por popularidade
let somaPopularidade = 0;
const pesosAcumulados = produtos.map((p) => {
  somaPopularidade += p.popularidade;
  return somaPopularidade;
});

function sortearProduto(prng) {
  const alvo = prng() * somaPopularidade;
  for (let i = 0; i < pesosAcumulados.length; i++) {
    if (alvo <= pesosAcumulados[i]) {
      return produtos[i];
    }
  }
  return produtos[produtos.length - 1];
}

// 8. Execução da simulação
console.log("Iniciando geração de dados simulados de BI...");
console.log(`Parâmetros: DIAS=${DIAS}, CARRINHOS=${CARRINHOS}, TAXA_CONVERSAO=${TAXA_CONVERSAO}, TAXA_CANCELAMENTO=${TAXA_CANCELAMENTO}, SEMENTE=${SEMENTE}`);

const prng = criarPRNG(SEMENTE);
const instanteGeracao = new Date();

// Banco sintético de usuários (pool de clientes)
const TOTAL_USUARIOS = Math.max(100, Math.floor(CARRINHOS * 0.4));
const bancoUsuarios = Array.from({ length: TOTAL_USUARIOS }, (_, i) =>
  gerarUsuarioHash(i + 1),
);

// Cálculo das quantidades por status
const totalConvertidos = Math.round(CARRINHOS * TAXA_CONVERSAO);
const totalCancelados = Math.round(totalConvertidos * TAXA_CANCELAMENTO);
const totalFinalizados = totalConvertidos - totalCancelados;
const totalCarrinhosAtivos = CARRINHOS - totalConvertidos;

const totalEtapaCarrinho = Math.round(totalCarrinhosAtivos * 0.6);
const totalEtapaCheckout = totalCarrinhosAtivos - totalEtapaCarrinho;

const listaStatusEtapa = [];
for (let i = 0; i < totalFinalizados; i++) {
  listaStatusEtapa.push({ status: "FINALIZADO", ultima_etapa: "" });
}
for (let i = 0; i < totalCancelados; i++) {
  listaStatusEtapa.push({ status: "CANCELADO", ultima_etapa: "" });
}
for (let i = 0; i < totalEtapaCarrinho; i++) {
  listaStatusEtapa.push({ status: "CARRINHO_ATIVO", ultima_etapa: "CARRINHO" });
}
for (let i = 0; i < totalEtapaCheckout; i++) {
  listaStatusEtapa.push({
    status: "CARRINHO_ATIVO",
    ultima_etapa: "CHECKOUT_INICIADO",
  });
}

// Embaralhamento determinístico (Fisher-Yates)
for (let i = listaStatusEtapa.length - 1; i > 0; i--) {
  const j = Math.floor(prng() * (i + 1));
  const temp = listaStatusEtapa[i];
  listaStatusEtapa[i] = listaStatusEtapa[j];
  listaStatusEtapa[j] = temp;
}

const listaPedidos = [];
const listaItens = [];

for (let i = 0; i < CARRINHOS; i++) {
  const pedidoId = `PED-${String(i + 1).padStart(5, "0")}`;
  const usuarioHash =
    bancoUsuarios[Math.floor(prng() * bancoUsuarios.length)];
  const cfg = listaStatusEtapa[i];
  const criadoEm = sortearData(prng, instanteGeracao, DIAS);

  // Sorteio de itens do pedido (1 a 4 itens distintos)
  const qtdItens = 1 + Math.floor(prng() * 4);
  const skusJaEscolhidos = new Set();
  let valorTotalPedido = 0;

  for (let k = 0; k < qtdItens; k++) {
    let prod = sortearProduto(prng);
    let tentativas = 0;
    while (skusJaEscolhidos.has(prod.sku) && tentativas < 5) {
      prod = sortearProduto(prng);
      tentativas++;
    }
    skusJaEscolhidos.add(prod.sku);

    const quantidade = 1 + Math.floor(prng() * 3);
    const precoUnitario = prod.preco;
    const tamanho =
      prod.tamanhos[Math.floor(prng() * prod.tamanhos.length)];
    const cor = prod.cor; // cor do produto (ou vazio para Beleza)

    valorTotalPedido += quantidade * precoUnitario;

    listaItens.push({
      pedido_id: pedidoId,
      produto_id: prod.sku,
      quantidade,
      preco_unitario: precoUnitario.toFixed(2),
      tamanho,
      cor,
      origem: "SIMULADO",
    });
  }

  // Definição de forma de pagamento e datas de atualização
  let formaPagamento = "";
  let atualizadoEm;

  if (cfg.status === "FINALIZADO") {
    formaPagamento =
      FORMAS_PAGAMENTO[Math.floor(prng() * FORMAS_PAGAMENTO.length)];
    // Finalização ocorre entre 1 e 15 minutos após criação
    const deltaMs = (1 + Math.floor(prng() * 14)) * 60 * 1000;
    atualizadoEm = new Date(
      Math.min(instanteGeracao.getTime(), criadoEm.getTime() + deltaMs),
    );
  } else if (cfg.status === "CANCELADO") {
    formaPagamento =
      FORMAS_PAGAMENTO[Math.floor(prng() * FORMAS_PAGAMENTO.length)];
    // Cancelamento ocorre entre 2h e 48h após criação
    const deltaMs = (2 + prng() * 46) * 60 * 60 * 1000;
    atualizadoEm = new Date(
      Math.min(instanteGeracao.getTime(), criadoEm.getTime() + deltaMs),
    );
    // Garante que atualizado_em seja estritamente posterior a criado_em
    if (atualizadoEm.getTime() <= criadoEm.getTime()) {
      atualizadoEm = new Date(criadoEm.getTime() + 60 * 1000);
    }
  } else {
    // CARRINHO_ATIVO: sem forma de pagamento
    formaPagamento = "";
    // Atualização entre 0 e 20 minutos após criação (sessão do carrinho)
    const deltaMs = Math.floor(prng() * 20) * 60 * 1000;
    atualizadoEm = new Date(
      Math.min(instanteGeracao.getTime(), criadoEm.getTime() + deltaMs),
    );
  }

  listaPedidos.push({
    id: pedidoId,
    usuario_hash: usuarioHash,
    status: cfg.status,
    ultima_etapa: cfg.ultima_etapa,
    valor_total: valorTotalPedido.toFixed(2),
    forma_pagamento: formaPagamento,
    criado_em: criadoEm.toISOString(),
    atualizado_em: atualizadoEm.toISOString(),
    origem: "SIMULADO",
  });
}

// 9. Construção dos dados de carrinhos.csv
const LIMITE_30_MIN_MS = 30 * 60 * 1000;
const listaCarrinhos = listaPedidos
  .filter((p) => p.status === "CARRINHO_ATIVO")
  .map((c) => {
    const atualizadoDate = new Date(c.atualizado_em);
    const abandonado =
      instanteGeracao.getTime() - atualizadoDate.getTime() > LIMITE_30_MIN_MS;
    return {
      id: c.id,
      usuario_hash: c.usuario_hash,
      status: c.status,
      ultima_etapa: c.ultima_etapa,
      valor_total: c.valor_total,
      abandonado: abandonado ? "true" : "false",
      criado_em: c.criado_em,
      atualizado_em: c.atualizado_em,
      origem: "SIMULADO",
    };
  });

// 10. Construção dos dados de produtos_enriquecido.csv (sem estoque)
const listaProdutosEnriquecido = produtos.map((p) => ({
  sku: p.sku,
  nome: p.nome,
  categoria: p.categoria,
  preco: p.preco.toFixed(2),
  custo: p.custo.toFixed(2),
  descricao: `"${gerarDescricao(p.nome, p.categoria)}"`,
  tamanhos: `"${p.tamanhos.join(", ")}"`,
  cores: p.cor,
  origem: "SIMULADO",
}));

// 11. Escrita dos arquivos CSV
if (!fs.existsSync(dirSaida)) {
  fs.mkdirSync(dirSaida, { recursive: true });
}

function salvarCSV(nomeArquivo, cabecalhos, linhasObjetos) {
  const caminhoCompleto = path.join(dirSaida, nomeArquivo);
  const cabecalhoLinha = cabecalhos.join(",");
  const corpoLinhas = linhasObjetos.map((obj) =>
    cabecalhos.map((c) => obj[c] !== undefined ? obj[c] : "").join(","),
  );
  const conteudoFinal = [cabecalhoLinha, ...corpoLinhas].join("\n") + "\n";
  fs.writeFileSync(caminhoCompleto, conteudoFinal, "utf-8");
  console.log(`Arquivo gerado: data/saida/${nomeArquivo} (${linhasObjetos.length} linhas)`);
}

salvarCSV(
  "pedidos.csv",
  [
    "id",
    "usuario_hash",
    "status",
    "ultima_etapa",
    "valor_total",
    "forma_pagamento",
    "criado_em",
    "atualizado_em",
    "origem",
  ],
  listaPedidos,
);

salvarCSV(
  "itens_pedido.csv",
  [
    "pedido_id",
    "produto_id",
    "quantidade",
    "preco_unitario",
    "tamanho",
    "cor",
    "origem",
  ],
  listaItens,
);

salvarCSV(
  "carrinhos.csv",
  [
    "id",
    "usuario_hash",
    "status",
    "ultima_etapa",
    "valor_total",
    "abandonado",
    "criado_em",
    "atualizado_em",
    "origem",
  ],
  listaCarrinhos,
);

salvarCSV(
  "produtos_enriquecido.csv",
  [
    "sku",
    "nome",
    "categoria",
    "preco",
    "custo",
    "descricao",
    "tamanhos",
    "cores",
    "origem",
  ],
  listaProdutosEnriquecido,
);

// 12. Cálculo e Impressão do Resumo de Métricas de BI
const finalizados = listaPedidos.filter((p) => p.status === "FINALIZADO");
const cancelados = listaPedidos.filter((p) => p.status === "CANCELADO");
const abandonados = listaCarrinhos.filter((c) => c.abandonado === "true");

const receitaTotalFinalizados = finalizados.reduce(
  (acc, p) => acc + parseFloat(p.valor_total),
  0,
);
const ticketMedioFinalizados =
  finalizados.length > 0 ? receitaTotalFinalizados / finalizados.length : 0;

const taxaConversaoCalculada = (totalConvertidos / CARRINHOS) * 100;
const taxaCancelamentoCalculada = (cancelados.length / totalConvertidos) * 100;
const taxaAbandonoCalculada = (totalCarrinhosAtivos / CARRINHOS) * 100;

console.log("\n========================================================");
console.log("            RESUMO DA SIMULAÇÃO DE DADOS BI             ");
console.log("========================================================");
console.log(`Total de carrinhos gerados : ${CARRINHOS}`);
console.log(`Pedidos finalizados        : ${finalizados.length}`);
console.log(`Pedidos cancelados         : ${cancelados.length}`);
console.log(`Carrinhos ativos no total  : ${totalCarrinhosAtivos}`);
console.log(`  - Etapa CARRINHO         : ${totalEtapaCarrinho}`);
console.log(`  - Etapa CHECKOUT_INICIADO: ${totalEtapaCheckout}`);
console.log(`Carrinhos abandonados (>30m): ${abandonados.length}`);
console.log("--------------------------------------------------------");
console.log(
  `Receita total (finalizados) : R$ ${receitaTotalFinalizados.toLocaleString(
    "pt-BR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  )}`,
);
console.log(
  `Ticket médio (finalizados)  : R$ ${ticketMedioFinalizados.toLocaleString(
    "pt-BR",
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  )}`,
);
console.log("--------------------------------------------------------");
console.log(
  `Taxa de conversão calculada : ${taxaConversaoCalculada.toFixed(2)}% (Parâmetro: ${(TAXA_CONVERSAO * 100).toFixed(2)}%)`,
);
console.log(
  `Taxa de cancelamento calc.  : ${taxaCancelamentoCalculada.toFixed(2)}% (Parâmetro: ${(TAXA_CANCELAMENTO * 100).toFixed(2)}%)`,
);
console.log(
  `Taxa de abandono calculada  : ${taxaAbandonoCalculada.toFixed(2)}% (Esperado: ${((1 - TAXA_CONVERSAO) * 100).toFixed(2)}%)`,
);
console.log("========================================================\n");
