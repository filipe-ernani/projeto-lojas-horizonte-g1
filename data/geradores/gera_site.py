"""Gera o histórico sintético do site da Lojas Horizonte (canal e-commerce).

Formato: contrato com a API do Caio (SCHEMA_PIPELINE_v1). Os arquivos têm exatamente
as colunas da exportação ao vivo da API, para histórico e ao vivo se juntarem na silver.

Saídas (em data/saida/site/, fora do Git), uma pasta por tabela:
    pedidos/pedidos_historico.csv.gz
    pedido_itens/pedido_itens_historico.csv.gz
    eventos/eventos_historico.csv.gz

Entradas:
    data/referencia/catalogo.csv            produtos, preços, cores (catálogo v2)
    data/referencia/sazonalidade_diaria.csv índice de sazonalidade (D14)
    data/geradores/parametros.yaml          seção "site"

Como cada sessão é simulada (funil):
    session_start -> view_product (0 ou mais) -> add_to_cart (0 ou mais)
    -> begin_checkout -> purchase
    Cada etapa acontece com a probabilidade definida em site.funil. Uma compra gera
    um pedido FINALIZADO; parte dos pedidos é cancelada depois (nova versão da linha).

Regras do contrato verificadas antes de salvar:
    1. toda sessão começa com session_start;
    2. todo purchase tem pedido_id, o pedido existe e valor = valor_total;
       todo pedido tem exatamente um purchase;
    3. purchase vem depois de add_to_cart e begin_checkout na mesma sessão;
    4. todo sku existe no catálogo.
O histórico não tem sujeira plantada: o contrato exige essas regras.

Uso (a partir da raiz do repositório):
    python data/geradores/gera_site.py
"""

import hashlib
from pathlib import Path

import numpy as np
import pandas as pd
import yaml

RAIZ = Path(__file__).resolve().parents[2]
PARAMETROS = RAIZ / "data" / "geradores" / "parametros.yaml"
CATALOGO = RAIZ / "data" / "referencia" / "catalogo.csv"
SAZONALIDADE = RAIZ / "data" / "referencia" / "sazonalidade_diaria.csv"

ORDEM = {"session_start": 0, "view_product": 1, "add_to_cart": 2, "begin_checkout": 3, "purchase": 4}
FORMATO_UTC = "%Y-%m-%dT%H:%M:%SZ"


def indice_do_site(datas: pd.DatetimeIndex, cfg: dict) -> pd.Series:
    """Índice diário do site: a sazonalidade do Olist COM o efeito de dia da semana do online.

    Para datas após o fim da série, usa o mesmo dia da semana 52 semanas antes (D14).
    """
    saz = pd.read_csv(SAZONALIDADE, parse_dates=["data"]).set_index("data")["indice"]
    inicio, fim = saz.index.min(), saz.index.max()
    valores = []
    for d in datas:
        origem = d
        while origem > fim:
            origem -= pd.Timedelta(days=364)
        if origem < inicio:
            raise ValueError(f"Sem sazonalidade para {d.date()}: ajuste data_inicio.")
        valores.append(saz.loc[origem])
    return pd.Series(valores, index=datas).clip(cfg["indice_minimo"], cfg["indice_maximo"])


def desconto_do_dia(datas: pd.DatetimeIndex, promocoes: list) -> pd.Series:
    desconto = pd.Series(0.0, index=datas)
    for p in promocoes:
        periodo = (datas >= pd.Timestamp(p["inicio"])) & (datas <= pd.Timestamp(p["fim"]))
        desconto[periodo] = p["desconto"]
    return desconto


def simula_dia(rng, dia, n_sessoes, desconto, produtos, cfg, clientes_peso) -> tuple:
    """Simula as sessões de um dia. Devolve eventos e itens comprados (horário local)."""
    f = cfg["funil"]
    prob = produtos["peso"].to_numpy()
    precos = np.round(produtos["preco"].to_numpy() * (1 - desconto), 2)
    n = n_sessoes
    sess = np.arange(n)

    # funil de cada sessão
    ve = rng.random(n) < f["ver_produto"]
    carrinho = ve & (rng.random(n) < f["adicionar_carrinho"])
    checkout = carrinho & (rng.random(n) < f["iniciar_checkout"])
    compra = checkout & (rng.random(n) < f["comprar"])

    # cliente: anônimo ou um da base; quem chega ao checkout se identifica
    anonimo = (rng.random(n) < cfg["prob_anonimo"]) & ~checkout
    cliente = rng.choice(len(clientes_peso), size=n, p=clientes_peso)
    cliente = np.where(anonimo, -1, cliente)

    # produtos vistos e itens do carrinho
    n_vistos = np.where(ve, rng.geometric(1 / cfg["produtos_vistos_media"], size=n), 0)
    n_itens = np.where(carrinho, rng.geometric(1 / cfg["itens_carrinho_media"], size=n), 0)
    sku_visto = rng.choice(len(produtos), size=n_vistos.sum(), p=prob)
    sku_item = rng.choice(len(produtos), size=n_itens.sum(), p=prob)
    qtd_item = 1 + (rng.random(n_itens.sum()) < cfg["prob_quantidade_2"]).astype(int)

    # eventos em ordem de etapa
    partes = [
        pd.DataFrame({"s": sess, "evento": "session_start", "sku": -1, "qtd": 0}),
        pd.DataFrame({"s": np.repeat(sess, n_vistos), "evento": "view_product", "sku": sku_visto, "qtd": 0}),
        pd.DataFrame({"s": np.repeat(sess, n_itens), "evento": "add_to_cart", "sku": sku_item, "qtd": qtd_item}),
        pd.DataFrame({"s": sess[checkout], "evento": "begin_checkout", "sku": -1, "qtd": 0}),
        pd.DataFrame({"s": sess[compra], "evento": "purchase", "sku": -1, "qtd": 0}),
    ]
    ev = pd.concat(partes, ignore_index=True)
    ev["ordem"] = ev["evento"].map(ORDEM)
    ev = ev.sort_values(["s", "ordem"], kind="stable").reset_index(drop=True)

    # horários: início da sessão + intervalos exponenciais entre as ações
    inicio_seg = rng.triangular(cfg["hora_min"], cfg["hora_pico"], cfg["hora_max"], size=n) * 3600
    intervalo = rng.exponential(cfg["segundos_entre_eventos"], size=len(ev))
    intervalo[ev["ordem"].to_numpy() == 0] = 0
    ev["seg"] = inicio_seg[ev["s"].to_numpy()] + ev.assign(i=intervalo).groupby("s")["i"].cumsum().to_numpy()
    ev["local"] = dia + pd.to_timedelta(ev["seg"].astype(int), unit="s")
    ev["cliente"] = cliente[ev["s"].to_numpy()]
    ev["preco"] = np.where(ev["sku"] >= 0, precos[ev["sku"].clip(lower=0)], np.nan)
    ev["dia"] = dia
    return ev


def main() -> None:
    params = yaml.safe_load(PARAMETROS.read_text(encoding="utf-8"))
    cfg = params["site"]
    rng = np.random.default_rng(params["seed"])

    catalogo = pd.read_csv(CATALOGO, keep_default_na=False)
    produtos = catalogo.copy()
    produtos["peso"] = produtos["popularidade"] * produtos["grupo"].map(cfg["peso_grupo"])
    produtos["peso"] /= produtos["peso"].sum()

    pesos_clientes = rng.lognormal(0, cfg["clientes_sigma"], size=cfg["clientes"])
    pesos_clientes /= pesos_clientes.sum()
    hashes = np.array([hashlib.sha256(f"horizonte-cliente-{i}".encode()).hexdigest()[:16]
                       for i in range(cfg["clientes"])])

    corte = pd.Timestamp(cfg["corte_utc"]).tz_localize(None)
    fuso = pd.Timedelta(hours=cfg["fuso_horas"])
    ultimo_dia_local = (corte + fuso).normalize()
    datas = pd.date_range(cfg["data_inicio"], ultimo_dia_local, freq="D")
    indice = indice_do_site(datas, cfg)
    desconto = desconto_do_dia(datas, cfg["promocoes"])

    dias = []
    deslocamento = 0
    for t, dia in enumerate(datas):
        n_sessoes = rng.poisson(cfg["sessoes_dia"] * indice.iloc[t])
        ev = simula_dia(rng, dia, n_sessoes, desconto.iloc[t], produtos, cfg, pesos_clientes)
        ev["s"] += deslocamento
        deslocamento += n_sessoes
        dias.append(ev)
    ev = pd.concat(dias, ignore_index=True)

    # horário local -> UTC; descarta sessões que terminam depois do corte
    ev["utc"] = ev["local"] - fuso
    fim_sessao = ev.groupby("s")["utc"].transform("max")
    ev = ev[fim_sessao < corte].reset_index(drop=True)

    # IDs do histórico (prefixo H-), em ordem de tempo
    ordem_sessoes = ev.groupby("s")["utc"].min().sort_values(kind="stable")
    id_sessao = pd.Series([f"H-{i + 1}" for i in range(len(ordem_sessoes))], index=ordem_sessoes.index)
    ev = ev.sort_values(["utc", "s", "ordem"], kind="stable").reset_index(drop=True)
    ev["evento_id"] = [f"H-{i + 1}" for i in range(len(ev))]
    ev["sessao_id"] = ev["s"].map(id_sessao)
    ev["usuario_hash"] = np.where(ev["cliente"] >= 0, hashes[ev["cliente"].clip(lower=0)], "")

    # pedidos: um por sessão com purchase; itens = add_to_cart da sessão
    compras = ev[ev["evento"] == "purchase"].sort_values(["utc", "s"], kind="stable")
    id_pedido = pd.Series([f"H-{i + 1}" for i in range(len(compras))], index=compras["s"].to_numpy())
    itens = ev[(ev["evento"] == "add_to_cart") & ev["s"].isin(id_pedido.index)].copy()
    itens["pedido_id"] = itens["s"].map(id_pedido)
    itens = itens.sort_values(["utc", "s"], kind="stable").reset_index(drop=True)
    itens["item_id"] = [f"H-{i + 1}" for i in range(len(itens))]
    itens["valor"] = np.round(itens["qtd"] * itens["preco"], 2)
    subtotal = itens.groupby("pedido_id")["valor"].sum().round(2)

    pedidos = pd.DataFrame({"pedido_id": id_pedido.to_numpy(), "s": id_pedido.index,
                            "finalizado": compras["utc"].to_numpy()})
    pedidos["subtotal"] = pedidos["pedido_id"].map(subtotal)
    pedidos["frete"] = np.where(pedidos["subtotal"] >= cfg["frete_gratis_acima"], 0.0, cfg["frete_fixo"])
    pedidos["valor_total"] = (pedidos["subtotal"] + pedidos["frete"]).round(2)
    pedidos["usuario_hash"] = pedidos["s"].map(ev.groupby("s")["usuario_hash"].first())
    formas = list(cfg["forma_pagamento"])
    pedidos["forma_pagamento"] = rng.choice(formas, size=len(pedidos), p=list(cfg["forma_pagamento"].values()))

    # cancelamento: só se acontecer antes do corte (senão, chegaria como carga incremental)
    h_min, h_max = cfg["cancelamento_horas"]
    atraso = pd.to_timedelta(rng.uniform(h_min, h_max, size=len(pedidos)) * 3600, unit="s").round("s")
    cancela = (rng.random(len(pedidos)) < cfg["prob_cancelamento"]) & (pedidos["finalizado"] + atraso < corte)
    pedidos["status"] = np.where(cancela, "CANCELADO", "FINALIZADO")
    pedidos["cancelado"] = (pedidos["finalizado"] + atraso).where(cancela)
    pedidos["atualizado"] = pedidos["cancelado"].fillna(pedidos["finalizado"])

    # valor nos eventos: add_to_cart = quantidade x preço; purchase = valor_total do pedido
    ev["pedido_id"] = np.where(ev["evento"] == "purchase", ev["s"].map(id_pedido), "")
    ev["valor"] = np.where(ev["evento"] == "add_to_cart", np.round(ev["qtd"] * ev["preco"], 2), np.nan)
    eh_compra = ev["evento"] == "purchase"
    ev.loc[eh_compra, "valor"] = ev.loc[eh_compra, "pedido_id"].map(pedidos.set_index("pedido_id")["valor_total"])

    # tamanho e cor dos itens
    skus = catalogo["sku"].to_numpy()
    tamanhos = cfg["tamanhos"]
    unico = set(cfg["tamanho_unico_tipos"])
    itens["sku_txt"] = skus[itens["sku"]]
    itens["tamanho"] = [
        "Único" if tipo in unico else rng.choice(tamanhos[cat])
        for tipo, cat in zip(catalogo["tipo"].to_numpy()[itens["sku"]], catalogo["categoria"].to_numpy()[itens["sku"]])
    ]
    itens["cor"] = catalogo["cor"].to_numpy()[itens["sku"]]

    # ---------------- checagens do contrato ----------------
    primeiro = ev.sort_values(["sessao_id", "utc", "ordem"], kind="stable").groupby("sessao_id")["evento"].first()
    assert (primeiro == "session_start").all(), "regra 1: sessão sem session_start no início"
    n_compras = ev[eh_compra].groupby("pedido_id").size()
    assert len(n_compras) == len(pedidos) and (n_compras == 1).all(), "regra 2: pedido sem exatamente um purchase"
    assert np.allclose(ev.loc[eh_compra, "valor"].to_numpy(),
                       ev.loc[eh_compra, "pedido_id"].map(pedidos.set_index("pedido_id")["valor_total"]).to_numpy()), \
        "regra 2: valor do purchase diferente do valor_total"
    sess_compra = set(ev.loc[eh_compra, "s"])
    for etapa in ("add_to_cart", "begin_checkout"):
        antes = ev[ev["evento"] == etapa].groupby("s")["utc"].min()
        depois = ev[eh_compra].set_index("s")["utc"]
        assert sess_compra <= set(antes.index), f"regra 3: compra sem {etapa}"
        assert (antes.loc[depois.index] <= depois).all(), f"regra 3: {etapa} depois do purchase"
    assert set(itens["sku_txt"]) <= set(skus), "regra 4: sku fora do catálogo"
    assert np.allclose(pedidos["subtotal"], pedidos["pedido_id"].map(itens.groupby("pedido_id")["valor"].sum())), \
        "subtotal diferente da soma dos itens"
    assert (ev["utc"] < corte).all() and (pedidos["atualizado"] < corte).all(), "registro depois do corte"
    assert (pedidos["usuario_hash"] != "").all(), "pedido sem usuario_hash"

    # ---------------- arquivos no formato do contrato ----------------
    def utc(s):
        return s.dt.strftime(FORMATO_UTC)

    saida_pedidos = pd.DataFrame({
        "pedido_id": pedidos["pedido_id"], "usuario_hash": pedidos["usuario_hash"],
        "status": pedidos["status"], "forma_pagamento": pedidos["forma_pagamento"],
        "subtotal": pedidos["subtotal"], "frete": pedidos["frete"], "valor_total": pedidos["valor_total"],
        "finalizado_em": utc(pedidos["finalizado"]), "cancelado_em": utc(pedidos["cancelado"]),
        "updated_at": utc(pedidos["atualizado"]), "origem": "SIMULADO",
    })
    saida_itens = pd.DataFrame({
        "item_id": itens["item_id"], "pedido_id": itens["pedido_id"], "sku": itens["sku_txt"],
        "quantidade": itens["qtd"], "preco_unitario": itens["preco"], "tamanho": itens["tamanho"],
        "cor": itens["cor"], "updated_at": utc(itens["pedido_id"].map(pedidos.set_index("pedido_id")["finalizado"])),
        "origem": "SIMULADO",
    })
    saida_eventos = pd.DataFrame({
        "evento_id": ev["evento_id"], "evento": ev["evento"], "ocorrido_em": utc(ev["utc"]),
        "sessao_id": ev["sessao_id"], "usuario_hash": ev["usuario_hash"],
        "sku": np.where(ev["sku"] >= 0, skus[ev["sku"].clip(lower=0)], ""),
        "quantidade": ev["qtd"].where(ev["evento"] == "add_to_cart").astype("Int64"),
        "valor": ev["valor"], "pedido_id": ev["pedido_id"], "updated_at": utc(ev["utc"]), "origem": "SIMULADO",
    })

    saida = RAIZ / cfg["pasta_saida"]
    for nome, df in (("pedidos", saida_pedidos), ("pedido_itens", saida_itens), ("eventos", saida_eventos)):
        pasta = saida / nome
        pasta.mkdir(parents=True, exist_ok=True)
        df.to_csv(pasta / f"{nome}_historico.csv.gz", index=False, encoding="utf-8", float_format="%.2f",
                  compression={"method": "gzip", "mtime": 0})   # mtime fixo: arquivo idêntico a cada execução

    # ---------------- resumo para conferência ----------------
    por_sessao = ev.groupby("s")["evento"].agg(set)
    com_carrinho = por_sessao.map(lambda e: "add_to_cart" in e)
    comprou = por_sessao.map(lambda e: "purchase" in e)
    finalizados = saida_pedidos[saida_pedidos["status"] == "FINALIZADO"]
    receita = saida_itens[saida_itens["pedido_id"].isin(finalizados["pedido_id"])].eval("quantidade * preco_unitario").sum()
    print(f"Período: {datas[0].date()} a {datas[-1].date()} (corte {cfg['corte_utc']})")
    print(f"Sessões: {len(por_sessao):,} | eventos: {len(ev):,} | pedidos: {len(pedidos):,} | itens: {len(itens):,}")
    print(f"Conversão: {comprou.mean():.2%} | abandono de carrinho: {1 - comprou[com_carrinho].mean():.1%} "
          f"| cancelamento: {cancela.mean():.1%}")
    print(f"Receita (FINALIZADO, sem frete): R$ {receita:,.2f} | ticket sem frete: R$ {receita / len(finalizados):.2f} "
          f"| ticket com frete: R$ {finalizados['valor_total'].mean():.2f}")
    print(f"Clientes com pedido: {saida_pedidos['usuario_hash'].nunique():,} | regras do contrato: OK")
    print(f"Arquivos em {saida.relative_to(RAIZ)}/")


if __name__ == "__main__":
    main()
