import { pool, query } from "../db.js";
import { ensureUsuarioExiste } from "./usuariosQueries.js";
import {
  gravarEvento,
  registrarBeginCheckoutSeNovo,
} from "../services/analyticsService.js";
import {
  chaveItemCarrinho,
  formatarCarrinho,
  obterFreteCentavos,
  validarFormatoItens,
  validarItemCarrinho,
} from "./carrinhoHelpers.js";

export { formatarCarrinho };

export async function obterCarrinhoQuery(usuarioId) {
  const pedRes = await query(
    `SELECT * FROM loja.pedidos
     WHERE usuario_id = $1 AND status = 'CARRINHO_ATIVO' LIMIT 1;`,
    [usuarioId],
  );

  if (pedRes.rows.length === 0) return formatarCarrinho(null, []);

  const pedido = pedRes.rows[0];
  const itensRes = await query(
    `SELECT i.*, p.nome, p.imagem_url, p.cores, p.preco AS preco_atual
     FROM loja.pedido_itens i
     JOIN loja.produtos p ON p.sku = i.sku
     WHERE i.pedido_id = $1 ORDER BY i.id ASC;`,
    [pedido.id],
  );

  return formatarCarrinho(pedido, itensRes.rows);
}

export async function substituirCarrinhoQuery(
  usuarioId,
  emailToken,
  { itens, ultimaEtapa = "CARRINHO" } = {},
  sessaoId = null,
) {
  const erroFormato = validarFormatoItens(itens);
  if (erroFormato) {
    return { erro: erroFormato, status: 400 };
  }

  await ensureUsuarioExiste(usuarioId, emailToken);
  const client = await pool.connect();

  try {
    await client.query("BEGIN;");

    // Serializa os PUTs do mesmo usuário: evita corrida na criação do carrinho
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0));", [
      `carrinho:${usuarioId}`,
    ]);

    if (itens.length === 0) {
      await client.query(
        "DELETE FROM loja.pedidos WHERE usuario_id = $1 AND status = 'CARRINHO_ATIVO';",
        [usuarioId],
      );
      await client.query("COMMIT;");
      return { sucesso: true, carrinho: formatarCarrinho(null, []) };
    }

    const skus = itens.map((i) => i.produtoId.trim());
    const prodRes = await client.query(
      "SELECT * FROM loja.produtos WHERE sku = ANY($1);",
      [skus],
    );
    const mapaProdutos = new Map(prodRes.rows.map((p) => [p.sku, p]));

    let subtotalCentavos = 0;
    const itensValidados = [];

    for (const item of itens) {
      const validacao = validarItemCarrinho(item, mapaProdutos.get(item.produtoId.trim()));
      if (!validacao.valido) {
        await client.query("ROLLBACK;");
        return { erro: validacao.erro, status: validacao.status };
      }
      subtotalCentavos += validacao.dados.precoCentavos * validacao.dados.quantidade;
      itensValidados.push(validacao.dados);
    }

    const freteCentavos = obterFreteCentavos();
    const totalCentavos = subtotalCentavos + freteCentavos;

    const subtotal = (subtotalCentavos / 100).toFixed(2);
    const frete = (freteCentavos / 100).toFixed(2);
    const valorTotal = (totalCentavos / 100).toFixed(2);
    const etapaValida = ultimaEtapa === "CHECKOUT_INICIADO" ? "CHECKOUT_INICIADO" : "CARRINHO";

    const anteriorRes = await client.query(
      `SELECT id, ultima_etapa FROM loja.pedidos
       WHERE usuario_id = $1 AND status = 'CARRINHO_ATIVO' FOR UPDATE;`,
      [usuarioId],
    );

    let pedidoId;
    let etapaAnterior = null;
    const itensAnteriores = new Map();

    if (anteriorRes.rows.length > 0) {
      pedidoId = anteriorRes.rows[0].id;
      etapaAnterior = anteriorRes.rows[0].ultima_etapa;
      const itensAnt = await client.query(
        "SELECT sku, tamanho, cor, quantidade FROM loja.pedido_itens WHERE pedido_id = $1;",
        [pedidoId],
      );
      itensAnt.rows.forEach((r) => {
        const chave = chaveItemCarrinho(r);
        itensAnteriores.set(chave, (itensAnteriores.get(chave) || 0) + Number(r.quantidade));
      });

      await client.query(
        `UPDATE loja.pedidos SET
          ultima_etapa = $2, subtotal = $3, frete = $4, valor_total = $5, updated_at = now()
         WHERE id = $1;`,
        [pedidoId, etapaValida, subtotal, frete, valorTotal],
      );
      await client.query("DELETE FROM loja.pedido_itens WHERE pedido_id = $1;", [pedidoId]);
    } else {
      const ins = await client.query(
        `INSERT INTO loja.pedidos (
          usuario_id, status, ultima_etapa, subtotal, frete, valor_total, criado_em, updated_at
        ) VALUES ($1, 'CARRINHO_ATIVO', $2, $3, $4, $5, now(), now()) RETURNING id;`,
        [usuarioId, etapaValida, subtotal, frete, valorTotal],
      );
      pedidoId = ins.rows[0].id;
    }

    for (const item of itensValidados) {
      await client.query(
        `INSERT INTO loja.pedido_itens (
          pedido_id, sku, quantidade, preco_unitario, tamanho, cor, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, now());`,
        [pedidoId, item.sku, item.quantidade, item.precoUnitario, item.tamanho, item.cor],
      );
    }

    await client.query("COMMIT;");

    if (sessaoId) {
      // Soma linhas repetidas para o aumento de cada variação ser contado uma vez
      const itensNovos = new Map();
      for (const item of itensValidados) {
        const chave = chaveItemCarrinho(item);
        const atual = itensNovos.get(chave);
        itensNovos.set(chave, {
          sku: item.sku,
          precoCentavos: item.precoCentavos,
          quantidade: (atual?.quantidade || 0) + item.quantidade,
        });
      }

      for (const [chave, item] of itensNovos) {
        const diff = item.quantidade - (itensAnteriores.get(chave) || 0);
        if (diff > 0) {
          gravarEvento({
            evento: "add_to_cart",
            sessaoId,
            usuarioId,
            sku: item.sku,
            quantidade: diff,
            valor: Number(((diff * item.precoCentavos) / 100).toFixed(2)),
          });
        }
      }
      if (etapaAnterior !== "CHECKOUT_INICIADO" && etapaValida === "CHECKOUT_INICIADO") {
        void registrarBeginCheckoutSeNovo({
          sessaoId,
          usuarioId,
          valor: Number(subtotal),
        });
      }
    }

    return {
      sucesso: true,
      carrinho: {
        itens: itensValidados.map((i) => ({
          produtoId: i.sku,
          nome: i.nome,
          preco: Number(i.precoUnitario),
          imagemUrl: i.imagemUrl,
          tamanho: i.tamanho,
          cor: i.cor,
          corHex: i.corHex,
          quantidade: i.quantidade,
        })),
        subtotal: Number(subtotal),
        frete: Number(frete),
        total: Number(valorTotal),
      },
    };
  } catch (error_) {
    await client.query("ROLLBACK;");
    throw error_;
  } finally {
    client.release();
  }
}
