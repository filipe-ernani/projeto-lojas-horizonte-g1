import crypto from "node:crypto";
import { pool, query } from "../db.js";
import { gravarEvento } from "../services/analyticsService.js";
import {
  formatarDataLocalSaoPaulo,
  formatarDataSimples,
  formatarIsoUtc,
} from "../utils/datas.js";
import { paraIdSeguro } from "../utils/validacao.js";
import { corHexPorNome, obterFreteCentavos } from "./carrinhoHelpers.js";

const FORMAS_PAGAMENTO = ["PIX", "CARTAO_CREDITO", "CARTAO_DEBITO"];
const OPCOES_PAGAMENTO = "PIX, CARTAO_CREDITO ou CARTAO_DEBITO";
const MAXIMO_PARCELAS = 12;
const VALIDADE_PIX_MS = 30 * 60 * 1000;

function formatarDataIso(data) {
  return data
    ? new Date(data).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
}

// Parcela sem juros, arredondada para cima ao centavo
function calcularValorParcela(valorTotal, parcelas) {
  const totalCentavos = Math.round(Number(valorTotal) * 100);
  return Math.ceil(totalCentavos / parcelas) / 100;
}

export function formatarPedido(p, itens = [], endereco = null) {
  const resumo = endereco
    ? `${endereco.cidade}/${endereco.uf}`
    : p.cidade && p.uf
      ? `${p.cidade}/${p.uf}`
      : "";

  const dataReferencia = p.finalizado_em || p.criado_em;
  const parcelas = Number(p.parcelas) || 1;

  return {
    id: Number(p.id),
    data:
      formatarDataSimples(dataReferencia) || formatarDataIso(dataReferencia),
    dataIso: formatarIsoUtc(dataReferencia),
    dataLocal: formatarDataLocalSaoPaulo(dataReferencia),
    criadoEm: formatarIsoUtc(p.criado_em),
    criadoEmLocal: formatarDataLocalSaoPaulo(p.criado_em),
    finalizadoEm: formatarIsoUtc(p.finalizado_em),
    finalizadoEmLocal: formatarDataLocalSaoPaulo(p.finalizado_em),
    canceladoEm: formatarIsoUtc(p.cancelado_em),
    canceladoEmLocal: formatarDataLocalSaoPaulo(p.cancelado_em),
    status: p.status,
    formaPagamento: p.forma_pagamento || null,
    parcelas,
    ...(p.forma_pagamento === "CARTAO_CREDITO" && {
      valorParcela: calcularValorParcela(p.valor_total, parcelas),
    }),
    total: Number(p.valor_total),
    qtdItens: itens.reduce((acc, i) => acc + Number(i.quantidade), 0),
    itens: itens.map((i) => ({
      produtoId: i.sku,
      nome: i.nome,
      preco: Number(i.preco_unitario),
      imagemUrl: i.imagem_url || null,
      tamanho: i.tamanho || null,
      cor: i.cor || null,
      corHex: corHexPorNome(i.cores, i.cor),
      quantidade: Number(i.quantidade),
    })),
    enderecoResumo: resumo,
  };
}

function validarPagamento(formaPagamento, parcelas) {
  if (formaPagamento === undefined || formaPagamento === null || formaPagamento === "") {
    return { erro: `Informe a forma de pagamento: ${OPCOES_PAGAMENTO}.` };
  }
  if (formaPagamento === "BOLETO") {
    return { erro: `Boleto não é aceito. Opções: ${OPCOES_PAGAMENTO}.` };
  }
  if (!FORMAS_PAGAMENTO.includes(formaPagamento)) {
    return { erro: `Forma de pagamento inválida. Opções: ${OPCOES_PAGAMENTO}.` };
  }

  const informouParcelas = parcelas !== undefined && parcelas !== null;

  if (formaPagamento === "CARTAO_CREDITO") {
    const totalParcelas = informouParcelas ? parcelas : 1;
    if (
      !Number.isSafeInteger(totalParcelas) ||
      totalParcelas < 1 ||
      totalParcelas > MAXIMO_PARCELAS
    ) {
      return {
        erro: `Parcelas devem ser um número inteiro de 1 a ${MAXIMO_PARCELAS}.`,
      };
    }
    return { parcelas: totalParcelas };
  }

  if (informouParcelas && parcelas !== 1) {
    return { erro: "Parcelamento disponível apenas no cartão de crédito." };
  }
  return { parcelas: 1 };
}

// Pagamento SIMULADO: nenhuma cobrança real é gerada
function gerarPixSimulado(pedidoId) {
  const codigo = crypto
    .createHash("sha256")
    .update(`pedido-${pedidoId}`)
    .digest("hex")
    .slice(0, 32)
    .toUpperCase();

  return {
    chave: "pix.simulado@lojashorizonte.example",
    codigoCopiaECola: `SIMULADO-${codigo}`,
    expiraEm: new Date(Date.now() + VALIDADE_PIX_MS).toISOString(),
    origem: "SIMULADO",
  };
}

export async function finalizarCarrinhoQuery(
  usuarioId,
  { enderecoId, formaPagamento, parcelas },
  sessaoId = null,
) {
  const pagamento = validarPagamento(formaPagamento, parcelas);
  if (pagamento.erro) {
    return { erro: pagamento.erro, status: 400 };
  }

  const idEndereco = paraIdSeguro(enderecoId);
  if (idEndereco === null) {
    return { erro: "Informe um endereço de entrega válido.", status: 400 };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN;");

    const endRes = await client.query(
      "SELECT id, cidade, uf FROM loja.enderecos WHERE id = $1 AND usuario_id = $2;",
      [idEndereco, usuarioId],
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
      `SELECT i.*, p.preco as preco_atual, p.nome, p.imagem_url, p.cores
       FROM loja.pedido_itens i
       JOIN loja.produtos p ON p.sku = i.sku
       WHERE i.pedido_id = $1 ORDER BY i.id ASC;`,
      [pedido.id],
    );
    if (itensRes.rows.length === 0) {
      await client.query("ROLLBACK;");
      return { erro: "Carrinho está vazio.", status: 400 };
    }

    // D7: a finalização cobra o preço atual do banco
    let subtotalCentavos = 0;
    for (const item of itensRes.rows) {
      const precoCentavos = Math.round(Number(item.preco_atual) * 100);
      subtotalCentavos += precoCentavos * Number(item.quantidade);
      await client.query(
        "UPDATE loja.pedido_itens SET preco_unitario = $1 WHERE id = $2;",
        [(precoCentavos / 100).toFixed(2), item.id],
      );
      item.preco_unitario = (precoCentavos / 100).toFixed(2);
    }

    const freteCentavos = obterFreteCentavos();
    const totalCentavos = subtotalCentavos + freteCentavos;

    const subtotal = (subtotalCentavos / 100).toFixed(2);
    const frete = (freteCentavos / 100).toFixed(2);
    const valorTotal = (totalCentavos / 100).toFixed(2);

    const updateRes = await client.query(
      `UPDATE loja.pedidos SET
        status = 'FINALIZADO', endereco_id = $1, forma_pagamento = $2, parcelas = $3,
        subtotal = $4, frete = $5, valor_total = $6, finalizado_em = now(), updated_at = now()
       WHERE id = $7 RETURNING *;`,
      [
        endereco.id,
        formaPagamento,
        pagamento.parcelas,
        subtotal,
        frete,
        valorTotal,
        pedido.id,
      ],
    );

    await client.query("COMMIT;");

    if (sessaoId) {
      void gravarEvento({
        evento: "purchase",
        sessaoId,
        usuarioId,
        pedidoId: pedido.id,
        valor: Number(valorTotal),
      });
    }

    const pedidoFormatado = formatarPedido(updateRes.rows[0], itensRes.rows, endereco);

    return {
      sucesso: true,
      pedido:
        formaPagamento === "PIX"
          ? { ...pedidoFormatado, pix: gerarPixSimulado(pedido.id) }
          : pedidoFormatado,
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
    `SELECT i.*, p.nome, p.imagem_url, p.cores FROM loja.pedido_itens i
     JOIN loja.produtos p ON p.sku = i.sku
     WHERE i.pedido_id = ANY($1) ORDER BY i.id ASC;`,
    [pedidosRes.rows.map((p) => p.id)],
  );

  const itensPorPedido = new Map();
  itensRes.rows.forEach((item) => {
    if (!itensPorPedido.has(item.pedido_id))
      itensPorPedido.set(item.pedido_id, []);
    itensPorPedido.get(item.pedido_id).push(item);
  });

  return pedidosRes.rows.map((p) =>
    formatarPedido(p, itensPorPedido.get(p.id) || []),
  );
}

export async function cancelarPedidoQuery(id, usuarioId) {
  // UPDATE único: dois cancelamentos simultâneos não passam juntos
  const updateRes = await query(
    `UPDATE loja.pedidos SET status = 'CANCELADO', cancelado_em = now(), updated_at = now()
     WHERE id = $1 AND usuario_id = $2 AND status = 'FINALIZADO'
     RETURNING *;`,
    [id, usuarioId],
  );

  if (updateRes.rows.length === 0) {
    const pedRes = await query(
      "SELECT status FROM loja.pedidos WHERE id = $1 AND usuario_id = $2;",
      [id, usuarioId],
    );

    if (pedRes.rows.length === 0)
      return { erro: "Pedido não encontrado.", status: 404 };
    if (pedRes.rows[0].status === "CANCELADO")
      return { erro: "Pedido já está cancelado.", status: 409 };
    return {
      erro: "Apenas pedidos finalizados podem ser cancelados.",
      status: 400,
    };
  }

  const row = updateRes.rows[0];
  return {
    sucesso: true,
    status: row.status,
    canceladoEm: formatarIsoUtc(row.cancelado_em),
    canceladoEmLocal: formatarDataLocalSaoPaulo(row.cancelado_em),
    dataLocal: formatarDataLocalSaoPaulo(row.cancelado_em),
  };
}
