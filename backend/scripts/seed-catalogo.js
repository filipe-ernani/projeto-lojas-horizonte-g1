import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";
import { opcaoSslBanco } from "../src/dbConfig.js";
import { parseCsvRfc4180 } from "../src/utils/csvParser.js";

// Carrega variáveis do .env do backend
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const { Pool } = pg;

// Mapa oficial de cores das 10 cores encontradas no catálogo (D-21 / SIMULADO)
export const MAPA_CORES = {
  Azul: "#2B4C6F",
  Bege: "#D4C4B5",
  Branco: "#FFFFFF",
  Cinza: "#8C857B",
  Marrom: "#6B4E3D",
  "Off-white": "#FAF7F2",
  Preto: "#1C1613",
  Rosa: "#D98A8A",
  Verde: "#4A6B53",
  Vinho: "#722F37",
};

/**
 * Normaliza cor e gênero (Preta->Preto, Branca->Branco) e valida contra MAPA_CORES.
 * Cor vazia vira null. Cor desconhecida lança erro com SKU e valor.
 */
export function normalizarCor(corBruta = "", sku = "", linha = 0) {
  const corTrim = String(corBruta || "").trim();
  if (!corTrim) {
    return null;
  }

  let corNormalizada = corTrim;
  if (/^preta$/i.test(corNormalizada)) {
    corNormalizada = "Preto";
  } else if (/^branca$/i.test(corNormalizada)) {
    corNormalizada = "Branco";
  }

  // Busca case-insensitive no MAPA_CORES mantendo a chave oficial
  const chaveOficial = Object.keys(MAPA_CORES).find(
    (c) => c.toLowerCase() === corNormalizada.toLowerCase(),
  );

  if (!chaveOficial) {
    throw new Error(
      `Cor desconhecida "${corBruta}" no produto SKU "${sku}" (linha ${linha}). Abortando sem gravar nada.`,
    );
  }

  return chaveOficial;
}

/**
 * Gera os tamanhos permitidos de acordo com a categoria do produto (Decisão D-21 - SIMULADO).
 */
export function gerarTamanhosPorCategoria(categoria = "") {
  const catNormalizada = categoria.trim();

  if (catNormalizada === "Calçados") {
    return ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44"];
  }

  if (
    catNormalizada === "Feminino" ||
    catNormalizada === "Masculino" ||
    catNormalizada === "Esporte" ||
    catNormalizada === "Moda íntima e praia"
  ) {
    return ["PP", "P", "M", "G", "GG"];
  }

  if (catNormalizada === "Infantil") {
    return ["2", "4", "6", "8", "10", "12"];
  }

  // Acessórios, Casa e Beleza
  return ["Único"];
}

export function localizarArquivoCatalogo() {
  const caminhos = [
    path.resolve(process.cwd(), "data/catalogo.csv"),
    path.resolve(process.cwd(), "data/catalogo (1).csv"),
    path.resolve(process.cwd(), "backend/data/catalogo.csv"),
    path.resolve(process.cwd(), "../data/catalogo.csv"),
    path.resolve(process.cwd(), "../data/catalogo (1).csv"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) {
      return c;
    }
  }

  throw new Error("Arquivo catalogo.csv não encontrado nos caminhos padrão.");
}

/**
 * Validação estrita do catálogo antes de qualquer escrita no banco de dados.
 */
export function validarCatalogo(cabecalho, registros) {
  const erros = [];
  const colunasObrigatorias = ["sku", "nome", "categoria", "grupo", "preco"];

  for (const col of colunasObrigatorias) {
    if (!cabecalho.includes(col)) {
      erros.push(`Coluna obrigatória ausente no cabeçalho: "${col}".`);
    }
  }

  if (erros.length > 0) {
    throw new Error(`Erro no cabeçalho do CSV:\n- ${erros.join("\n- ")}`);
  }

  const skusVistos = new Map();
  const produtosValidados = [];

  for (const reg of registros) {
    const linha = reg._linhaArquivo;
    const sku = String(reg.sku || "").trim();
    const nome = String(reg.nome || "").trim();
    const categoria = String(reg.categoria || "").trim();
    const grupo = String(reg.grupo || "").trim();
    const precoNum = Number(reg.preco);

    if (!sku) {
      erros.push(`Linha ${linha}: SKU vazio ou não informado.`);
    } else if (skusVistos.has(sku)) {
      erros.push(
        `Linha ${linha}: SKU duplicado "${sku}" (já apareceu na linha ${skusVistos.get(sku)}).`,
      );
    } else {
      skusVistos.set(sku, linha);
    }

    if (!nome) {
      erros.push(`Linha ${linha} (SKU ${sku}): nome vazio.`);
    }
    if (!categoria) {
      erros.push(`Linha ${linha} (SKU ${sku}): categoria vazia.`);
    }
    if (!grupo) {
      erros.push(`Linha ${linha} (SKU ${sku}): grupo vazio.`);
    }

    if (isNaN(precoNum) || precoNum <= 0) {
      erros.push(
        `Linha ${linha} (SKU ${sku}): preco inválido ("${reg.preco}"). Deve ser numérico > 0.`,
      );
    }

    let corNormalizada = null;
    try {
      corNormalizada = normalizarCor(reg.cor, sku, linha);
    } catch (eCor) {
      erros.push(eCor.message);
    }

    const ocasioes = reg.ocasioes
      ? String(reg.ocasioes)
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    produtosValidados.push({
      sku,
      nome,
      modelo: String(reg.modelo || "").trim() || null,
      categoria,
      grupo,
      preco: precoNum,
      custo:
        reg.custo !== undefined && reg.custo !== "" && !isNaN(Number(reg.custo))
          ? Number(reg.custo)
          : null,
      popularidade:
        reg.popularidade !== undefined &&
        reg.popularidade !== "" &&
        !isNaN(Number(reg.popularidade))
          ? Number(reg.popularidade)
          : null,
      tipo: String(reg.tipo || "").trim() || null,
      variacao: String(reg.variacao || "").trim() || null,
      cor: corNormalizada,
      descricao: String(reg.descricao || "").trim() || null,
      ocasioes,
      linha,
    });
  }

  if (skusVistos.size !== 200) {
    erros.push(
      `O catálogo deve conter exatamente 200 SKUs únicos. Encontrados: ${skusVistos.size}.`,
    );
  }

  if (erros.length > 0) {
    throw new Error(
      `Validação do catálogo falhou com ${erros.length} erro(s). Nenhuma alteração foi gravada:\n- ${erros.join("\n- ")}`,
    );
  }

  return produtosValidados;
}

/**
 * 4b) Compara os dados do CSV com o banco atual antes de gravar e emite o resumo.
 */
export async function compararComBancoAtual(client, produtosValidados) {
  const res = await client.query(
    "SELECT sku, nome, preco, categoria FROM loja.produtos;",
  );
  const mapaBanco = new Map(res.rows.map((r) => [r.sku, r]));

  let atualizados = 0;
  const mudancas = [];
  const skusCsv = new Set(produtosValidados.map((p) => p.sku));

  for (const pCsv of produtosValidados) {
    if (mapaBanco.has(pCsv.sku)) {
      atualizados++;
      const pDb = mapaBanco.get(pCsv.sku);
      const mudouNome = pDb.nome !== pCsv.nome;
      const mudouPreco = Number(pDb.preco) !== Number(pCsv.preco);
      const mudouCategoria = pDb.categoria !== pCsv.categoria;

      if (mudouNome || mudouPreco || mudouCategoria) {
        mudancas.push({
          sku: pCsv.sku,
          nomeAntigo: mudouNome ? pDb.nome : undefined,
          nomeNovo: mudouNome ? pCsv.nome : undefined,
          precoAntigo: mudouPreco ? Number(pDb.preco) : undefined,
          precoNovo: mudouPreco ? Number(pCsv.preco) : undefined,
          categoriaAntiga: mudouCategoria ? pDb.categoria : undefined,
          categoriaNova: mudouCategoria ? pCsv.categoria : undefined,
        });
      }
    }
  }

  const bancoNaoNoCsv = [];
  for (const [skuDb] of mapaBanco) {
    if (!skusCsv.has(skuDb)) {
      bancoNaoNoCsv.push(skuDb);
    }
  }

  console.log("\n=== Resumo da Comparação com o Banco Atual (4b) ===");
  console.log(`- SKUs a serem atualizados (já no banco): ${atualizados}`);
  console.log(
    `- SKUs que mudaram de nome, preço ou categoria: ${mudancas.length}`,
  );
  if (mudancas.length > 0) {
    console.log("  Exemplos de mudanças (até 10):");
    mudancas.slice(0, 10).forEach((m) => {
      const detalhes = [];
      if (m.nomeAntigo) detalhes.push(`nome: "${m.nomeAntigo}" -> "${m.nomeNovo}"`);
      if (m.precoAntigo !== undefined) detalhes.push(`preço: ${m.precoAntigo} -> ${m.precoNovo}`);
      if (m.categoriaAntiga) detalhes.push(`categoria: "${m.categoriaAntiga}" -> "${m.categoriaNova}"`);
      console.log(`  * [${m.sku}] ${detalhes.join(" | ")}`);
    });
  }
  console.log(
    `- SKUs do banco que NÃO estão no CSV (preservados, não apagados): ${bancoNaoNoCsv.length}`,
  );
  if (bancoNaoNoCsv.length > 0) {
    console.log(`  SKUs preservados: ${bancoNaoNoCsv.join(", ")}`);
  }
  console.log("===================================================\n");

  return { atualizados, mudancas, bancoNaoNoCsv };
}

export async function executarSeed() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      `postgresql://${process.env.POSTGRES_USER || "postgres"}:${process.env.POSTGRES_PASSWORD || "postgres"}@localhost:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || "horizonte"}`,
    ssl: opcaoSslBanco(),
  });

  const caminhoCsv = localizarArquivoCatalogo();
  console.log(`Lendo catálogo de: ${caminhoCsv}`);

  const conteudo = fs.readFileSync(caminhoCsv, "utf8");
  const { cabecalho, registros } = parseCsvRfc4180(conteudo);

  console.log(`Colunas detectadas: ${cabecalho.join(", ")}`);
  console.log(`Total de registros no CSV: ${registros.length}`);

  // 1 & 2 & 3: Validação estrita antes de tocar no banco
  const produtosValidados = validarCatalogo(cabecalho, registros);

  const client = await pool.connect();

  try {
    // 4b: Comparar com banco antes de gravar
    await compararComBancoAtual(client, produtosValidados);

    // 5: Upsert em transação
    await client.query("BEGIN;");

    const coresIdentificadas = new Set();
    let processados = 0;

    for (const p of produtosValidados) {
      const tamanhos = gerarTamanhosPorCategoria(p.categoria);
      const cores = p.cor ? [{ nome: p.cor, hex: MAPA_CORES[p.cor] }] : [];

      if (p.cor) {
        coresIdentificadas.add(p.cor);
      }

      const querySql = `
        INSERT INTO loja.produtos (
          sku, nome, modelo, categoria, grupo, preco, custo, popularidade,
          tipo, variacao, descricao, ocasioes,
          tamanhos, cores, imagem_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15
        )
        ON CONFLICT (sku) DO UPDATE SET
          nome = EXCLUDED.nome,
          modelo = EXCLUDED.modelo,
          categoria = EXCLUDED.categoria,
          grupo = EXCLUDED.grupo,
          preco = EXCLUDED.preco,
          custo = EXCLUDED.custo,
          popularidade = EXCLUDED.popularidade,
          tipo = EXCLUDED.tipo,
          variacao = EXCLUDED.variacao,
          descricao = EXCLUDED.descricao,
          ocasioes = EXCLUDED.ocasioes,
          tamanhos = EXCLUDED.tamanhos,
          cores = EXCLUDED.cores,
          imagem_url = EXCLUDED.imagem_url,
          updated_at = now();
      `;

      await client.query(querySql, [
        p.sku,
        p.nome,
        p.modelo,
        p.categoria,
        p.grupo,
        p.preco,
        p.custo,
        p.popularidade,
        p.tipo,
        p.variacao,
        p.descricao,
        p.ocasioes,
        tamanhos,
        JSON.stringify(cores),
        null,
      ]);

      processados++;
    }

    await client.query("COMMIT;");

    const totalBanco = await client.query(
      "SELECT count(*)::int as total FROM loja.produtos;",
    );

    console.log(`Seed concluído com sucesso!`);
    console.log(`Produtos processados nesta execução: ${processados}`);
    console.log(`Total de produtos em loja.produtos: ${totalBanco.rows[0].total}`);
    console.log(
      `Cores distintas identificadas (${coresIdentificadas.size}):`,
      Array.from(coresIdentificadas).sort(),
    );
  } catch (erro) {
    await client.query("ROLLBACK;").catch(() => {});
    console.error("Erro durante o seed do catálogo:", erro.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executa se chamado diretamente
if (process.argv[1] && process.argv[1].endsWith("seed-catalogo.js")) {
  await executarSeed();
}
