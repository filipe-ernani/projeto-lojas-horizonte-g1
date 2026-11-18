import { pool, query } from "../db.js";
import { gravarEvento } from "../services/analyticsService.js";

function formatarDataIso(data) {
  return data ? new Date(data).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
}

export function formatarPedido(p, itens = [], endereco = null) {
  const resumo = endereco
    ? `${endereco.cidade}/${endereco.uf}`
    : p.cidade && p.uf ? `${p.cidade}/${p.uf}` : "";

  return {
    id: Number(p.id),
    data: formatarDataIso(p.finalizado_em || p.criado_em),
    status: p.status,
    total: Number(p.valor_total),
    qtdItens: itens.reduce((acc, i) => acc + Number(i.quantidade), 0),
    itens: itens.map((i) => ({
      produtoId: i.sku,
      nome: i.nome,
      preco: Number(i.preco_unitario),
      imagemUrl: i.imagem_url || null,
      tamanho: i.tamanho || null,
      cor: i.cor || null,
      quantidade: Number(i.quantidade),
    })),
    enderecoResumo: resumo,
  };
}

export async function finalizarCarrinhoQuery(
  usuarioId,
  { enderecoId, formaPagamento },
  sessaoId = null,
) {
  if (!["PIX", "CARTAO", "BOLETO"].includes(formaPagamento)) {
    return { erro: "Forma de pagamento inválida. Opções: PIX, CARTAO, BOLETO.", status: 400 };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    const endRes = await client.query(
      "SELECT id, cidade, uf FROM loja.enderecos WHERE id = $1 AND usuario_id = $2;",
      [enderecoId, usuarioId],
    );
    if (endRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return { erro: "Endereço não encontrado.", status: 404 };
    }
    const endereco = endRes.rows[0];

    const pedRes = await client.query(
      `SELECT * FROM loja.pedidos
       WHERE usuario_id = $1 AND status = 'CARRINHO_ATIVO' FOR UPDATE;`,
      [usuarioId],
    );
    if (pedRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return { erro: "Carrinho está vazio.", status: 400 };
    }
    const pedido = pedRes.rows[0];

    const itensRes = await client.query(
      `SELECT i.*, p.preco as preco_atual, p.nome, p.imagem_url
       FROM loja.pedido_itens i
       JOIN loja.produtos p ON p.sku = i.sku
       WHERE i.pedido_id = $1;`,
      [pedido.id],
    );
    if (itensRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return { erro: "Carrinho está vazio.", status: 400 };
    }

    let subtotalCentavos = 0;
    for (const item of itensRes.rows) {
      const precoCentavos = Math.round(Number(item.preco_atual) * 100);
      subtotalCentavos += precoCentavos * Number(item.quantidade);
      await client.query("UPDATE loja.pedido_itens SET preco_unitario = $1 WHERE id = $2;", [
        (precoCentavos / 100).toFixed(2),
        item.id,
      ]);
      item.preco_unitario = (precoCentavos / 100).toFixed(2);
    }

    const freteCentavos = Math.round((Number(process.env.FRETE_SIMULADO) || 15.0) * 100);
    const totalCentavos = subtotalCentavos + freteCentavos;

    const subtotal = (subtotalCentavos / 100).toFixed(2);
    const frete = (freteCentavos / 100).toFixed(2);
    const valorTotal = (totalCentavos / 100).toFixed(2);

    const updateRes = await client.query(
      `UPDATE loja.pedidos SET
        status = 'FINALIZADO', endereco_id = $1, forma_pagamento = $2,
        subtotal = $3, frete = $4, valor_total = $5, finalizado_em = now(), updated_at = now()
       WHERE id = $6 RETURNING *;`,
      [endereco.id, formaPagamento, subtotal, frete, valorTotal, pedido.id],
    );

    await client.query("COMMIT;");

    if (sessaoId) {
      gravarEvento({
        evento: "purchase",
        sessaoId,
        usuarioId,
        pedidoId: pedido.id,
        valor: Number(valorTotal),
      });
    }

    return {
      sucesso: true,
      pedido: formatarPedido(updateRes.rows[0], itensRes.rows, endereco),
    };
  } catch (error_) {
    await client.query("ROLLBACK;");
    throw error_;
  } finally {
    client.release();
  }
}

export async function listarMeusPedidosQuery(usuarioId) {
  const pedidosRes = await query(
    `SELECT p.*, e.cidade, e.uf FROM loja.pedidos p
     LEFT JOIN loja.enderecos e ON e.id = p.endereco_id
     WHERE p.usuario_id = $1 AND p.status IN ('FINALIZADO', 'CANCELADO')
     ORDER BY p.criado_em DESC, p.id DESC;`,
    [usuarioId],
  );

  if (pedidosRes.rows.length === 0) return [];

  const itensRes = await query(
    `SELECT i.*, p.nome, p.imagem_url FROM loja.pedido_itens i
     JOIN loja.produtos p ON p.sku = i.sku
     WHERE i.pedido_id = ANY($1) ORDER BY i.id ASC;`,
    [pedidosRes.rows.map((p) => p.id)],
  );

  const itensPorPedido = new Map();
  itensRes.rows.forEach((item) => {
    if (!itensPorPedido.has(item.pedido_id)) itensPorPedido.set(item.pedido_id, []);
    itensPorPedido.get(item.pedido_id).push(item);
  });

  return pedidosRes.rows.map((p) =>
    formatarPedido(p, itensPorPedido.get(p.id) || []),
  );
}

export async function cancelarPedidoQuery(id, usuarioId) {
  const pedRes = await query(
    "SELECT * FROM loja.pedidos WHERE id = $1 AND usuario_id = $2;",
    [id, usuarioId],
  );

  if (pedRes.rows.length === 0) return { erro: "Pedido não encontrado.", status: 404 };
  if (pedRes.rows[0].status === "CANCELADO") return { erro: "Pedido já está cancelado.", status: 409 };
  if (pedRes.rows[0].status !== "FINALIZADO") {
    return { erro: "Apenas pedidos finalizados podem ser cancelados.", status: 400 };
  }

  const updateRes = await query(
    `UPDATE loja.pedidos SET status = 'CANCELADO', cancelado_em = now(), updated_at = now()
     WHERE id = $1 RETURNING *;`,
    [id],
  );

  return { sucesso: true, status: updateRes.rows[0].status };
}
