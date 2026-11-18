function normalizar(txt = "") {
  return String(txt)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\uFFFD/g, "u")
    .trim()
    .toLowerCase();
}

export function formatarCarrinho(pedido, itens = []) {
  if (!pedido || itens.length === 0) {
    return { itens: [], subtotal: 0, frete: 0, total: 0 };
  }

  return {
    itens: itens.map((i) => ({
      produtoId: i.sku,
      nome: i.nome,
      preco: Number(i.preco_unitario),
      imagemUrl: i.imagem_url || null,
      tamanho: i.tamanho || null,
      cor: i.cor || null,
      quantidade: Number(i.quantidade),
    })),
    subtotal: Number(pedido.subtotal),
    frete: Number(pedido.frete),
    total: Number(pedido.valor_total),
  };
}

export function validarItemCarrinho(item, produto) {
  const sku = String(item.produtoId || "").trim();
  if (!produto) {
    return { erro: `Produto não encontrado: ${sku}`, status: 400 };
  }

  const qtd = Number(item.quantidade);
  if (!Number.isInteger(qtd) || qtd < 1 || qtd > 10) {
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

  const cores =
    typeof produto.cores === "string"
      ? JSON.parse(produto.cores)
      : produto.cores || [];
  let corFinal = null;

  if (cores.length > 0) {
    const corEncontrada = cores.find(
      (c) => normalizar(c.nome) === normalizar(item.cor),
    );
    if (!item.cor || !corEncontrada) {
      return { erro: `Cor inválida para ${sku}.`, status: 400 };
    }
    corFinal = corEncontrada.nome;
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
      nome: produto.nome,
      imagemUrl: produto.imagem_url,
    },
  };
}
