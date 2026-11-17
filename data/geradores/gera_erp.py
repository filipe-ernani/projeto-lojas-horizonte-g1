"""Gera os dados sintéticos do ERP da Lojas Horizonte (canal loja física).

Saídas (em data/saida/erp/, fora do Git):
    erp_lojas.csv              cadastro das 12 lojas
    erp_produtos.csv           cadastro de produtos (o ERP é o cadastro mestre)
    erp_vendas.csv.gz          itens vendidos, um por linha de cupom fiscal
    erp_estoque_diario.csv.gz  posição de estoque por loja, SKU e dia

Entradas:
    data/referencia/catalogo.csv            produtos, preços e custos
    data/referencia/sazonalidade_diaria.csv índice de sazonalidade (D14)
    data/geradores/parametros.yaml          seção "erp"

Como o volume de cada dia é calculado:
    unidades esperadas = unidades_dia do porte da loja
                         x índice de sazonalidade sem o efeito de dia da semana do online
                         x fator de dia da semana da loja física (D15)

O estoque é simulado dia a dia: a loja só vende o que tem. Quando o estoque cai ao
ponto de pedido, uma reposição chega alguns dias depois. Picos como a Black Friday
podem esgotar produtos (ruptura), como acontece no varejo real.

Uso (a partir da raiz do repositório):
    python data/geradores/gera_erp.py
"""

from pathlib import Path

import numpy as np
import pandas as pd
import yaml

RAIZ = Path(__file__).resolve().parents[2]
PARAMETROS = RAIZ / "data" / "geradores" / "parametros.yaml"
CATALOGO = RAIZ / "data" / "referencia" / "catalogo.csv"
SAZONALIDADE = RAIZ / "data" / "referencia" / "sazonalidade_diaria.csv"

DIAS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"]


def indice_da_loja_fisica(datas: pd.DatetimeIndex, cfg: dict) -> pd.Series:
    """Índice diário de vendas da loja física, a partir da sazonalidade do Olist.

    1. Remove o padrão de dia da semana do online (mediana do índice por dia da semana).
    2. Para datas após o fim da série, usa o mesmo dia da semana 52 semanas antes.
    3. Limita valores extremos e aplica o padrão de dia da semana da loja física.
    """
    saz = pd.read_csv(SAZONALIDADE, parse_dates=["data"]).set_index("data")
    fator_online = saz.groupby("dia_semana")["indice"].median()
    sem_dia_semana = saz["indice"] / saz["dia_semana"].map(fator_online)

    inicio_serie, fim_serie = saz.index.min(), saz.index.max()
    valores = []
    for d in datas:
        origem = d
        while origem > fim_serie:
            origem -= pd.Timedelta(days=364)
        if origem < inicio_serie:
            raise ValueError(f"Sem sazonalidade para {d.date()}: ajuste data_inicio.")
        valores.append(sem_dia_semana.loc[origem])

    indice = pd.Series(valores, index=datas).clip(cfg["indice_minimo"], cfg["indice_maximo"])
    fator_loja = pd.Series([cfg["fator_dia_semana"][DIAS[d.day_of_week]] for d in datas], index=datas)
    return indice * fator_loja


def desconto_do_dia(datas: pd.DatetimeIndex, promocoes: list) -> pd.Series:
    desconto = pd.Series(0.0, index=datas)
    for p in promocoes:
        periodo = (datas >= pd.Timestamp(p["inicio"])) & (datas <= pd.Timestamp(p["fim"]))
        desconto[periodo] = p["desconto"]
    return desconto


def sortimento_da_loja(rng, produtos: pd.DataFrame, fracao: float) -> pd.DataFrame:
    """Escolhe os SKUs que a loja trabalha; produtos mais populares têm mais chance de entrar."""
    n = int(round(len(produtos) * fracao))
    if n >= len(produtos):
        return produtos.reset_index(drop=True)
    pesos = produtos["peso"] / produtos["peso"].sum()
    escolhidos = rng.choice(len(produtos), size=n, replace=False, p=pesos)
    return produtos.iloc[np.sort(escolhidos)].reset_index(drop=True)


def simula_loja(rng, loja: dict, produtos: pd.DataFrame, datas, indice, desconto, cfg) -> tuple:
    """Simula cupons e estoque de uma loja, dia a dia."""
    porte = cfg["portes"][loja["porte"]]
    est = cfg["estoque"]
    n = len(produtos)
    prob = (produtos["peso"] / produtos["peso"].sum()).to_numpy()
    precos = produtos["preco"].to_numpy()
    skus = produtos["sku"].to_numpy()

    # política de estoque baseada na demanda média de cada SKU
    demanda_media = porte["unidades_dia"] * prob
    maximo = np.ceil(demanda_media * est["dias_maximo"]).astype(int)
    ponto_pedido = np.ceil(demanda_media * est["ponto_pedido_dias"]).astype(int)
    estoque = maximo.copy()
    chegada = np.full(n, -1)          # índice do dia em que a reposição pendente chega
    qtd_pedida = np.zeros(n, dtype=int)

    vendas, posicoes = [], []
    media_itens = cfg["itens_por_cupom_media"]
    abre, fecha = cfg["horario_abertura"], cfg["horario_fechamento"]

    for t, dia in enumerate(datas):
        estoque_inicial = estoque.copy()

        # 1. chegam as reposições previstas para hoje
        entradas = np.where(chegada == t, qtd_pedida, 0)
        estoque += entradas
        chegada[chegada == t] = -1

        # 2. clientes: cupons e itens desejados
        n_cupons = rng.poisson(porte["unidades_dia"] * indice.iloc[t] / media_itens)
        itens_por_cupom = rng.geometric(1 / media_itens, size=n_cupons)
        cupom_de_cada_item = np.repeat(np.arange(n_cupons), itens_por_cupom)
        sku_de_cada_item = rng.choice(n, size=len(cupom_de_cada_item), p=prob)

        # 3. só sai o que há em estoque (na ordem de chegada dos clientes)
        ordem_no_sku = pd.Series(sku_de_cada_item).groupby(sku_de_cada_item).cumcount().to_numpy()
        atendido = ordem_no_sku < estoque[sku_de_cada_item]
        saidas = np.bincount(sku_de_cada_item[atendido], minlength=n)
        estoque -= saidas

        # 4. reposição: pede quando atinge o ponto de pedido e não há pedido pendente
        pedir = (estoque <= ponto_pedido) & (chegada == -1)
        qtd_pedida[pedir] = maximo[pedir] - estoque[pedir]
        chegada[pedir] = t + est["prazo_entrega_dias"]

        posicoes.append(pd.DataFrame({
            "data": dia.strftime("%Y-%m-%d"), "loja_id": loja["loja_id"], "sku": skus,
            "estoque_inicial": estoque_inicial, "entradas": entradas,
            "saidas": saidas, "estoque_final": estoque,
        }))

        if atendido.any():
            itens = pd.DataFrame({"cupom": cupom_de_cada_item[atendido], "sku_idx": sku_de_cada_item[atendido]})
            itens = itens.groupby(["cupom", "sku_idx"]).size().rename("quantidade").reset_index()
            hora_cupom = rng.triangular(abre, 17, fecha, size=n_cupons)   # pico no fim da tarde
            minutos = (hora_cupom[itens["cupom"]] * 60).astype(int)
            preco_unit = np.round(precos[itens["sku_idx"]] * (1 - desconto.iloc[t]), 2)
            vendas.append(pd.DataFrame({
                "cupom_id": [f"{loja['loja_id']}-{dia:%Y%m%d}-{c:05d}" for c in itens["cupom"]],
                "data_hora": [f"{dia:%Y-%m-%d} {m // 60:02d}:{m % 60:02d}:00" for m in minutos],
                "loja_id": loja["loja_id"],
                "sku": skus[itens["sku_idx"]],
                "quantidade": itens["quantidade"].to_numpy(),
                "preco_unitario": preco_unit,
                "valor_total": np.round(preco_unit * itens["quantidade"].to_numpy(), 2),
            }))

    return pd.concat(vendas, ignore_index=True), pd.concat(posicoes, ignore_index=True)


def planta_sujeira(rng, vendas: pd.DataFrame, cfg: dict) -> pd.DataFrame:
    """Insere problemas de qualidade conhecidos, para as checagens encontrarem."""
    s = cfg["sujeira"]
    vendas = vendas.copy()
    n = len(vendas)
    vendas["sku"] = vendas["sku"].astype(object)
    nulos = rng.choice(n, size=int(n * s["sku_nulo"]), replace=False)
    vendas.loc[nulos, "sku"] = None
    negativos = rng.choice(n, size=int(n * s["quantidade_negativa"]), replace=False)
    vendas.loc[negativos, "quantidade"] *= -1
    vendas.loc[negativos, "valor_total"] *= -1
    duplicadas = vendas.iloc[rng.choice(n, size=int(n * s["linhas_duplicadas"]), replace=False)]
    return pd.concat([vendas, duplicadas], ignore_index=True).sort_values(["data_hora", "cupom_id"], kind="stable")


def main() -> None:
    params = yaml.safe_load(PARAMETROS.read_text(encoding="utf-8"))
    cfg = params["erp"]
    rng = np.random.default_rng(params["seed"])

    catalogo = pd.read_csv(CATALOGO)
    produtos_loja = catalogo[~catalogo["grupo"].isin(cfg["grupos_fora_da_loja_fisica"])].copy()
    produtos_loja["peso"] = produtos_loja["popularidade"] * produtos_loja["grupo"].map(cfg["peso_grupo"])

    datas = pd.date_range(cfg["data_inicio"], cfg["data_fim"], freq="D")
    indice = indice_da_loja_fisica(datas, cfg)
    desconto = desconto_do_dia(datas, cfg["promocoes"])

    todas_vendas, todo_estoque = [], []
    for loja in cfg["lojas"]:
        sortimento = sortimento_da_loja(rng, produtos_loja, cfg["portes"][loja["porte"]]["sortimento"])
        v, e = simula_loja(rng, loja, sortimento, datas, indice, desconto, cfg)
        todas_vendas.append(v)
        todo_estoque.append(e)
        print(f"{loja['loja_id']} {loja['nome']:<26} {len(sortimento):>3} SKUs  "
              f"R$ {v['valor_total'].sum():>14,.2f}")

    vendas = planta_sujeira(rng, pd.concat(todas_vendas, ignore_index=True), cfg)
    estoque = pd.concat(todo_estoque, ignore_index=True)

    lojas = pd.DataFrame(cfg["lojas"])
    produtos = catalogo.rename(columns={"preco": "preco_tabela"})[
        ["sku", "nome", "modelo", "categoria", "grupo", "preco_tabela", "custo"]]

    saida = RAIZ / cfg["pasta_saida"]
    saida.mkdir(parents=True, exist_ok=True)
    lojas.to_csv(saida / "erp_lojas.csv", index=False, encoding="utf-8")
    produtos.to_csv(saida / "erp_produtos.csv", index=False, encoding="utf-8", float_format="%.2f")
    vendas.to_csv(saida / "erp_vendas.csv.gz", index=False, encoding="utf-8", float_format="%.2f",
                  compression={"method": "gzip", "mtime": 0})   # mtime fixo: arquivo idêntico a cada execução
    estoque.to_csv(saida / "erp_estoque_diario.csv.gz", index=False, encoding="utf-8",
                   compression={"method": "gzip", "mtime": 0})

    # resumo para conferência
    validas = vendas.dropna(subset=["sku"])
    validas = validas[validas["quantidade"] > 0].drop_duplicates()
    por_dia = validas.groupby(validas["data_hora"].str[:10])["quantidade"].sum()
    ruptura = (estoque["estoque_final"] == 0).mean()
    print(f"\nPeríodo: {cfg['data_inicio']} a {cfg['data_fim']} ({len(datas)} dias)")
    print(f"Linhas de venda: {len(vendas):,} | cupons: {vendas['cupom_id'].nunique():,} "
          f"| receita: R$ {validas['valor_total'].sum():,.2f}")
    print(f"Ticket médio: R$ {validas.groupby('cupom_id')['valor_total'].sum().mean():.2f}")
    print(f"Itens/dia (mediana): {por_dia.median():.0f} | Black Friday 28/11/2025: {por_dia.get('2025-11-28', 0):.0f}")
    print(f"Linhas de estoque: {len(estoque):,} | SKU-dias com estoque zerado: {ruptura:.1%}")
    print(f"Arquivos em {saida.relative_to(RAIZ)}/")


if __name__ == "__main__":
    main()
