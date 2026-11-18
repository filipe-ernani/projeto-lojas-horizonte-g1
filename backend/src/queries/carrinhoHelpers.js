function normalizar(txt = "") {
  return String(txt)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/�/g, "u")
    .trim()
    .toLowerCase();
}

function lerCores(cores) {
  const lista = typeof cores === "string" ? JSON.parse(cores) : cores;
  return Array.isArray(lista) ? lista : [];
}

/** Busca o hex da cor pelo nome em produtos.cores; null quando não houver. */
export function corHexPorNome(cores, nomeCor) {
  if (!nomeCor) return null;
  const encontrada = lerCores(cores).find(
    (c) => normalizar(c.nome) === normalizar(nomeCor),
  );
  return encontrada?.hex || null;
}

/** Hex da primeira cor do produto; null quando o produto não tem cor. */
export function primeiraCorHex(cores) {
  return lerCores(cores)[0]?.hex || null;
}

export function obterFreteCentavos() {
  return Math.round((Number(process.env.FRETE_SIMULADO) || 15.0) * 100);
}

/** Chave que identifica uma linha do carrinho: sku + tamanho + cor. */
export function chaveItemCarrinho({ sku, tamanho, cor }) {
  return JSON.stringify([sku, tamanho || null, cor || null]);
}

// D7: a cesta sempre mostra o preço atual do produto
export function formatarCarrinho(pedido, itens = []) {
  if (!pedido || itens.length === 0) {
    return { itens: [], subtotal: 0, frete: 0, total: 0 };
  }

  let subtotalCentavos = 0;
  const itensFormatados = itens.map((i) => {
    const precoCentavos = Math.round(Number(i.preco_atual) * 100);
    subtotalCentavos += precoCentavos * Number(i.quantidade);

    return {
      produtoId: i.sku,
      nome: i.nome,
      preco: precoCentavos / 100,
      imagemUrl: i.imagem_url || null,
      tamanho: i.tamanho || null,
      cor: i.cor || null,
      corHex: corHexPorNome(i.cores, i.cor),
      quantidade: Number(i.quantidade),
    };
  });

  const freteCentavos = obterFreteCentavos();

  return {
    itens: itensFormatados,
    subtotal: subtotalCentavos / 100,
    frete: freteCentavos / 100,
    total: (subtotalCentavos + freteCentavos) / 100,
  };
}

/** Confere o formato da lista antes de consultar o banco. */
export function validarFormatoItens(itens) {
  if (!Array.isArray(itens)) {
    return "O campo itens é obrigatório e deve ser uma lista. Envie [] para esvaziar a cesta.";
  }

  for (const item of itens) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return "Cada item da cesta deve ser um objeto.";
    }
    if (typeof item.produtoId !== "string" || !item.produtoId.trim()) {
      return "Cada item da cesta deve informar o produtoId.";
    }
    if (item.produtoId.includes("\0")) {
      return "O produtoId contém caractere inválido.";
    }
  }

  return null;
}

export function validarItemCarrinho(item, produto) {
  const sku = String(item.produtoId || "").trim();
  if (!produto) {
    return { erro: `Produto não encontrado: ${sku}`, status: 400 };
  }

  const qtd =
    typeof item.quantidade === "string" && /^\d+$/.test(item.quantidade.trim())
      ? Number(item.quantidade.trim())
      : item.quantidade;
  if (!Number.isSafeInteger(qtd) || qtd < 1 || qtd > 10) {
    return { erro: "Quantidade deve ser um número inteiro de 1 a 10.", status: 400 };
  }

  const tamanhos = produto.tamanhos || [];
  let tamanhoFinal = null;
  if (tamanhos.length > 0) {
    let tamEncontrado = tamanhos.find(
      (t) => normalizar(t) === normalizar(item.tamanho),
    );
    // Suporte a Único com problemas de encoding
    if (!tamEncontrado && tamanhos.length === 1 && String(tamanhos[0]).includes("nico")) {
      if (String(item.tamanho).toLowerCase().includes("nico") || normalizar(item.tamanho) === "unico") {
        tamEncontrado = tamanhos[0];
      }
    }

    if (!item.tamanho || !tamEncontrado) {
      return {
        erro: `Tamanho inválido para ${sku}. Opções: ${tamanhos.join(", ")}.`,
        status: 400,
      };
    }
    tamanhoFinal = tamEncontrado;
  }

  const cores = lerCores(produto.cores);
  let corFinal = null;
  let corHexFinal = null;

  if (cores.length > 0) {
    const corEncontrada = cores.find(
      (c) => normalizar(c.nome) === normalizar(item.cor),
    );
    if (!item.cor || !corEncontrada) {
      return { erro: `Cor inválida para ${sku}.`, status: 400 };
    }
    corFinal = corEncontrada.nome;
    corHexFinal = corEncontrada.hex || null;
  }

  const precoCentavos = Math.round(Number(produto.preco) * 100);

  return {
    valido: true,
    dados: {
      sku,
      quantidade: qtd,
      precoUnitario: (precoCentavos / 100).toFixed(2),
      precoCentavos,
      tamanho: tamanhoFinal,
      cor: corFinal,
      corHex: corHexFinal,
      nome: produto.nome,
      imagemUrl: produto.imagem_url,
    },
  };
}
