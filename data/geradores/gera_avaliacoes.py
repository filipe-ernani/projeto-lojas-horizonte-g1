"""Gera as avaliações sintéticas de produto do site da Lojas Horizonte (D25).

Cada avaliação nasce de um item comprado no histórico do site: mesmo cliente
(usuario_hash), mesmo pedido (pedido_id) e mesmo SKU, com data depois da compra.
Os números de calibração vêm do Olist (notebook 02_perfil_olist, seções 6 e 7);
as premissas e os textos estão na seção "avaliacoes" do parametros.yaml.

Saída (em data/saida/site/, fora do Git):
    avaliacoes/avaliacoes_historico.csv.gz

Colunas (proposta para o avaliacoes.csv da v1.1 do contrato com a API):
    avaliacao_id, pedido_id, sku, usuario_hash, nota, titulo, comentario,
    avaliado_em, updated_at, origem

Entradas:
    data/saida/site/pedidos/ e pedido_itens/  saída do gera_site.py (rode-o antes)
    data/referencia/catalogo.csv              categoria, grupo e ocasiões de cada SKU
    data/geradores/parametros.yaml            seções "site" (corte) e "avaliacoes"

Como funciona:
    1. Candidatos: itens de pedidos FINALIZADO, um por cliente e SKU (a primeira compra).
    2. Uma fração (taxa_avaliacao) recebe avaliação, com data = compra + prazo (lognormal
       com a mediana e o p90 do Olist). Avaliações que cairiam depois do corte não entram.
    3. Nota: distribuição do Olist deslocada pela qualidade do SKU.
    4. Título e comentário: com a chance do Olist para cada nota; o texto é montado por
       regra (abertura, frase sobre o produto, ocasião de uso, fechamento).
    5. Sujeira plantada (duplicadas, nota inválida, SKU sem cadastro), com contagem conhecida.

Uso (a partir da raiz do repositório):
    python data/geradores/gera_site.py        # se ainda não rodou
    python data/geradores/gera_avaliacoes.py
"""

from pathlib import Path

import numpy as np
import pandas as pd
import yaml

RAIZ = Path(__file__).resolve().parents[2]
PARAMETROS = RAIZ / "data" / "geradores" / "parametros.yaml"
CATALOGO = RAIZ / "data" / "referencia" / "catalogo.csv"

FORMATO_UTC = "%Y-%m-%dT%H:%M:%SZ"
Z90 = 1.2815515655446004   # quantil 90% da normal padrão


def tom(nota: int) -> str:
    return "negativo" if nota <= 2 else ("neutro" if nota == 3 else "positivo")


def monta_comentario(rng, nota: int, categoria: str, grupo: str, ocasioes: list, cfg: dict) -> str:
    """Abertura + frases sorteadas entre produto, ocasião e fechamento, até o limite de caracteres."""
    t = cfg["textos"]
    produto = t["produto"].get(categoria, t["produto"].get(grupo))
    extras = [
        rng.choice(produto[tom(nota)]),
        t["ocasiao"][tom(nota)].format(ocasiao=t["ocasioes_texto"][rng.choice(ocasioes)]),
        rng.choice(t["fechamento"][nota]),
    ]
    minimo, maximo = cfg["frases_por_nota"][nota]
    n_frases = rng.integers(minimo, maximo + 1)
    ordem = rng.permutation(len(extras))[: n_frases - 1]
    frases = [rng.choice(t["abertura"][nota])] + [extras[i] for i in sorted(ordem)]
    while len(" ".join(frases)) > cfg["comentario_max_caracteres"] and len(frases) > 1:
        frases.pop()
    return " ".join(frases)


def main() -> None:
    params = yaml.safe_load(PARAMETROS.read_text(encoding="utf-8"))
    cfg = params["avaliacoes"]
    rng = np.random.default_rng(params["seed"])
    corte = pd.Timestamp(params["site"]["corte_utc"]).tz_localize(None)

    pasta_site = RAIZ / params["site"]["pasta_saida"]
    pedidos = pd.read_csv(pasta_site / "pedidos" / "pedidos_historico.csv.gz", dtype=str, keep_default_na=False)
    itens = pd.read_csv(pasta_site / "pedido_itens" / "pedido_itens_historico.csv.gz", dtype=str, keep_default_na=False)
    catalogo = pd.read_csv(CATALOGO, keep_default_na=False).set_index("sku")

    # 1. candidatos: itens de pedidos FINALIZADO, um por cliente e SKU (primeira compra)
    finalizados = pedidos.loc[pedidos["status"] == "FINALIZADO", ["pedido_id", "usuario_hash", "finalizado_em"]]
    cand = itens[["item_id", "pedido_id", "sku"]].merge(finalizados, on="pedido_id")
    cand["comprado"] = pd.to_datetime(cand["finalizado_em"], format=FORMATO_UTC)
    cand = (cand.sort_values(["comprado", "item_id"], kind="stable")
                .drop_duplicates(["usuario_hash", "sku"]).reset_index(drop=True))

    # 2. quem avalia e quando (lognormal com a mediana e o p90 do Olist)
    avalia = rng.random(len(cand)) < cfg["taxa_avaliacao"]
    mu = np.log(cfg["prazo_dias"]["mediana"])
    sigma = (np.log(cfg["prazo_dias"]["p90"]) - mu) / Z90
    dias = rng.lognormal(mu, sigma, size=len(cand))
    cand["avaliado"] = (cand["comprado"] + pd.to_timedelta(dias * 86400, unit="s")).dt.round("s")
    av = cand[avalia & (cand["avaliado"] < corte)].copy()

    # 3. nota: distribuição do Olist deslocada pela qualidade do SKU
    notas = np.array(sorted(cfg["notas"]))
    alvo = np.array([cfg["notas"][k] for k in notas])
    qualidade = pd.Series(rng.normal(0, cfg["qualidade_sku_sigma"], size=len(catalogo)), index=catalogo.index)
    q = qualidade.loc[av["sku"]].to_numpy()[:, None]

    def distribuicao(base):
        p = base * np.exp(q * (notas - 3))
        return p / p.sum(axis=1, keepdims=True)

    # o deslocamento espalha as notas para as pontas; ajusta a base para que a
    # distribuição geral continue igual à do Olist (cálculo fixo, sem sorteio)
    base = alvo.copy()
    for _ in range(200):
        base *= alvo / distribuicao(base).mean(axis=0)
    prob = distribuicao(base)
    acumulada = prob.cumsum(axis=1)
    av["nota"] = notas[(rng.random(len(av))[:, None] > acumulada).sum(axis=1)]

    # 4. título e comentário
    tem_titulo = rng.random(len(av)) < av["nota"].map(cfg["prob_titulo"]).to_numpy()
    tem_comentario = rng.random(len(av)) < av["nota"].map(cfg["prob_comentario"]).to_numpy()
    av["titulo"] = [rng.choice(cfg["textos"]["titulos"][n]) if t else "" for n, t in zip(av["nota"], tem_titulo)]
    info = catalogo.loc[av["sku"], ["categoria", "grupo", "ocasioes"]].to_numpy()
    av["comentario"] = [
        monta_comentario(rng, n, cat, grp, oc.split(";"), cfg) if c else ""
        for n, c, (cat, grp, oc) in zip(av["nota"], tem_comentario, info)
    ]

    # IDs do histórico (prefixo H-), em ordem de tempo
    av = av.sort_values(["avaliado", "item_id"], kind="stable").reset_index(drop=True)
    av["avaliacao_id"] = [f"H-{i + 1}" for i in range(len(av))]

    # ---------------- checagens antes da sujeira ----------------
    comprados = set(zip(cand["pedido_id"], cand["sku"], cand["usuario_hash"]))
    assert all(t in comprados for t in zip(av["pedido_id"], av["sku"], av["usuario_hash"])), "avaliação sem compra"
    assert (av["avaliado"] > av["comprado"]).all() and (av["avaliado"] < corte).all(), "data fora do intervalo"
    assert av["nota"].between(1, 5).all(), "nota fora de 1 a 5"
    assert (av["comentario"].str.len() <= cfg["comentario_max_caracteres"]).all(), "comentário longo demais"
    assert not av.duplicated(["usuario_hash", "sku"]).any(), "cliente avaliou o mesmo SKU duas vezes"

    # ---------------- sujeira plantada ----------------
    s = cfg["sujeira"]
    n_nota, n_sku, n_dup = (round(len(av) * s[k]) for k in ("nota_invalida", "sku_sem_cadastro", "linhas_duplicadas"))
    sorteio = rng.permutation(len(av))
    i_nota, i_sku, i_dup = (sorteio[:n_nota], sorteio[n_nota:n_nota + n_sku],
                            sorteio[n_nota + n_sku:n_nota + n_sku + n_dup])
    av["_limpa"] = True
    av.loc[np.concatenate([i_nota, i_sku]), "_limpa"] = False
    av.loc[i_nota, "nota"] = rng.choice([0, 6], size=n_nota)
    av.loc[i_sku, "sku"] = [f"HZ-XXX-{900 + i}" for i in range(n_sku)]
    assert not set(av.loc[i_sku, "sku"]) & set(catalogo.index), "SKU inventado existe no catálogo"
    # cada cópia fica logo abaixo da linha original
    copias = av.loc[i_dup].copy()
    copias["_ordem"] = copias.index + 0.5
    av = (pd.concat([av.assign(_ordem=av.index.astype(float)), copias])
            .sort_values("_ordem", kind="stable").reset_index(drop=True))

    # ---------------- arquivo ----------------
    saida = pd.DataFrame({
        "avaliacao_id": av["avaliacao_id"], "pedido_id": av["pedido_id"], "sku": av["sku"],
        "usuario_hash": av["usuario_hash"], "nota": av["nota"], "titulo": av["titulo"],
        "comentario": av["comentario"], "avaliado_em": av["avaliado"].dt.strftime(FORMATO_UTC),
        "updated_at": av["avaliado"].dt.strftime(FORMATO_UTC), "origem": "SIMULADO",
    })
    pasta = RAIZ / cfg["pasta_saida"] / "avaliacoes"
    pasta.mkdir(parents=True, exist_ok=True)
    saida.to_csv(pasta / "avaliacoes_historico.csv.gz", index=False, encoding="utf-8",
                 compression={"method": "gzip", "mtime": 0})   # mtime fixo: arquivo idêntico a cada execução

    # ---------------- resumo para conferência ----------------
    limpas = saida[av["_limpa"].to_numpy()].drop_duplicates()
    dist = limpas["nota"].value_counts(normalize=True).sort_index()
    com = limpas["comentario"] != ""
    por_sku = limpas["sku"].value_counts().reindex(catalogo.index, fill_value=0)
    print(f"Candidatos (cliente x SKU comprado): {len(cand):,} | avaliações: {len(saida):,} linhas "
          f"({len(av) - n_dup:,} avaliações + {n_dup} duplicadas)")
    print("Notas (%):", " ".join(f"{k}={v:.1%}" for k, v in dist.items()), "| Olist:",
          " ".join(f"{k}={v:.1%}" for k, v in cfg["notas"].items()))
    print("Com comentário por nota:", " ".join(f"{k}={v:.0%}" for k, v in com.groupby(limpas["nota"]).mean().items()))
    print("Mediana de caracteres por nota:",
          " ".join(f"{k}={int(v)}" for k, v in limpas.loc[com, "comentario"].str.len().groupby(limpas.loc[com, "nota"]).median().items()))
    print(f"Avaliações por SKU: mediana {por_sku.median():.0f}, máx. {por_sku.max()}, SKUs sem avaliação {(por_sku == 0).sum()}")
    print(f"Sujeira plantada: {n_dup} duplicadas | {n_nota} nota inválida | {n_sku} SKU sem cadastro")
    print(f"Arquivo em {pasta.relative_to(RAIZ)}/")


if __name__ == "__main__":
    main()
