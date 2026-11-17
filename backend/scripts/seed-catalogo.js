import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

// Carrega variáveis do .env do backend
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

const { Pool } = pg;

// Mapa oficial de cores das 10 cores encontradas no catálogo (D-21 / SIMULADO)
const MAPA_CORES = {
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
 * Gera os tamanhos permitidos de acordo com a categoria do produto (Decisão D-21 - SIMULADO).
 */
function gerarTamanhosPorCategoria(categoria = "") {
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

/**
 * Extrai a cor do nome do produto (última palavra) ou devolve vazio para Beleza (Decisão D-21 - SIMULADO).
 */
function gerarCoresPorProduto(nome = "", categoria = "") {
  if (categoria.trim() === "Beleza") {
    return [];
  }

  const partes = nome.trim().split(/\s+/);
  const corNome = partes[partes.length - 1];
  const hex = MAPA_CORES[corNome] || "#6B4E3D";

  return [{ nome: corNome, hex }];
}

/**
 * Gera descrição curta e neutra baseada no modelo e na categoria (Decisão D-21 - SIMULADO).
 */
function gerarDescricaoSimulada(modelo = "", categoria = "") {
  return `${modelo} da categoria ${categoria}. Peça contemporânea com corte minimalista e conforto para o dia a dia.`;
}

function localizarArquivoCatalogo() {
  const caminhos = [
    path.resolve(process.cwd(), "data/catalogo.csv"),
    path.resolve(process.cwd(), "backend/data/catalogo.csv"),
    path.resolve(process.cwd(), "../data/catalogo.csv"),
  ];

  for (const c of caminhos) {
    if (fs.existsSync(c)) {
      return c;
    }
  }

  throw new Error("Arquivo catalogo.csv não encontrado nos caminhos padrão.");
}

async function executarSeed() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      `postgresql://${process.env.POSTGRES_USER || "postgres"}:${process.env.POSTGRES_PASSWORD || "postgres"}@localhost:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || "horizonte"}`,
  });

  const caminhoCsv = localizarArquivoCatalogo();
  console.log(`Lendo catálogo de: ${caminhoCsv}`);

  const conteudo = fs.readFileSync(caminhoCsv, "utf8");
  const linhas = conteudo
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const cabecalho = linhas[0].split(",");
  const dados = linhas.slice(1);

  console.log(`Linhas do catálogo: ${dados.length} produtos.`);

  const coresIdentificadas = new Set();
  let processados = 0;

  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    for (const linha of dados) {
      const colunas = linha.split(",");
      if (colunas.length < 8) continue;

      const [sku, nome, modelo, categoria, grupo, preco, custo, popularidade] =
        colunas;

      const tamanhos = gerarTamanhosPorCategoria(categoria);
      const cores = gerarCoresPorProduto(nome, categoria);
      const descricao = gerarDescricaoSimulada(modelo, categoria);

      cores.forEach((c) => coresIdentificadas.add(c.nome));

      const query = `
        INSERT INTO loja.produtos (
          sku, nome, modelo, categoria, grupo, preco, custo, popularidade,
          descricao, tamanhos, cores, imagem_url
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12
        )
        ON CONFLICT (sku) DO UPDATE SET
          nome = EXCLUDED.nome,
          modelo = EXCLUDED.modelo,
          categoria = EXCLUDED.categoria,
          grupo = EXCLUDED.grupo,
          preco = EXCLUDED.preco,
          custo = EXCLUDED.custo,
          popularidade = EXCLUDED.popularidade,
          descricao = EXCLUDED.descricao,
          tamanhos = EXCLUDED.tamanhos,
          cores = EXCLUDED.cores,
          imagem_url = EXCLUDED.imagem_url,
          updated_at = now();
      `;

      await client.query(query, [
        sku.trim(),
        nome.trim(),
        modelo.trim(),
        categoria.trim(),
        grupo.trim(),
        Number(preco),
        Number(custo),
        Number(popularidade),
        descricao,
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
    await client.query("ROLLBACK;");
    console.error("Erro durante o seed do catálogo:", erro);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

executarSeed();
