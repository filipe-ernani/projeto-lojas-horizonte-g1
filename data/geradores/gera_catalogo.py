"""Gera o catálogo de produtos de moda da Lojas Horizonte (data/referencia/catalogo.csv).

O catálogo é compartilhado pelos geradores do ERP e do site e pela API da loja,
para que os três canais usem os mesmos SKUs, categorias, preços e custos.

Uso (a partir da raiz do repositório):
    python data/geradores/gera_catalogo.py

Regra de preço (detalhes em data/geradores/parametros.yaml):
    preço = preço-base do TIPO  x  fator do COMPLEMENTO
    - o preço-base de cada tipo é um ponto da faixa de preço do Olist da categoria;
    - a cor não muda o preço: o mesmo modelo em cores diferentes custa o mesmo.

Colunas da v2 (D21), para o agente de recomendação, montadas por regra, sem sorteio:
    tipo, variacao, cor   partes do nome, em colunas separadas
    descricao             frase do tipo + frase da variação + cor
    ocasioes              ocasiões de uso do tipo e da variação, separadas por ";"
    imagem_url            uma imagem por tipo de produto em cada categoria
O nome concorda com o gênero do tipo (ex.: "Sapatilha Esportiva", "Blusa Feminina").

Com a mesma seed, o arquivo gerado é sempre idêntico.
"""

import unicodedata
from pathlib import Path
from statistics import NormalDist

import numpy as np
import pandas as pd
import yaml

RAIZ = Path(__file__).resolve().parents[2]
PARAMETROS = RAIZ / "data" / "geradores" / "parametros.yaml"

# Código curto de cada categoria, usado no SKU (ex.: HZ-FEM-001)
CODIGOS = {
    "Feminino": "FEM",
    "Masculino": "MAS",
    "Infantil": "INF",
    "Calçados": "CAL",
    "Moda íntima e praia": "INT",
    "Acessórios": "ACE",
    "Esporte": "ESP",
    "Beleza": "BEL",
    "Casa": "CAS",
}

# Público acrescentado ao nome nas categorias de roupa, para não confundir
# "Camiseta Algodão Preto" masculina com a infantil
PUBLICO = {"Feminino": "Feminino", "Masculino": "Masculino", "Infantil": "Infantil"}

# 0,6745 é o quantil 75% da normal padrão: liga o intervalo p25-p75 ao desvio da lognormal
Z75 = NormalDist().inv_cdf(0.75)


def concorda(palavra: str, tipo: str, cfg_catalogo: dict) -> str:
    """Flexiona a palavra para o gênero e o número do tipo (ex.: Esportivo -> Esportiva)."""
    genero = cfg_catalogo["genero_tipo"]
    formas = cfg_catalogo["flexao"].get(palavra)
    if formas is None:
        return palavra
    if tipo in genero["feminino"]:
        return formas[0]
    if tipo in genero["masculino_plural"]:
        return formas[1]
    return palavra


def slug(texto: str) -> str:
    """'Óculos de Sol' -> 'oculos-de-sol' (para o nome do arquivo de imagem)."""
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return "-".join(sem_acento.lower().split())


def preco_de_varejo(valor: float) -> float:
    """Arredonda para um preço de vitrine terminado em ,90 (ex.: 83,27 -> 82,90)."""
    return max(9.90, float(np.floor(valor)) - 0.10)


def precos_base_por_tipo(faixa: dict, tipos: list, q_min: float, q_max: float) -> dict:
    """Distribui os tipos (do mais barato ao mais caro) ao longo da faixa de preço do Olist.

    A faixa é modelada como uma lognormal com a mesma mediana e o mesmo intervalo p25-p75
    da categoria no Olist. Cada tipo recebe o preço de um quantil, igualmente espaçados
    entre q_min e q_max.
    """
    mu = np.log(faixa["mediana"])
    sigma = np.log(faixa["p75"] / faixa["p25"]) / (2 * Z75)
    quantis = np.linspace(q_min, q_max, len(tipos)) if len(tipos) > 1 else [0.5]
    return {
        tipo: float(np.exp(mu + sigma * NormalDist().inv_cdf(q)))
        for tipo, q in zip(tipos, quantis)
    }


def fatores_por_complemento(complementos: list, fator_min: float, fator_max: float) -> dict:
    """Complementos listados do mais barato ao mais caro recebem fatores crescentes."""
    fatores = np.linspace(fator_min, fator_max, len(complementos)) if len(complementos) > 1 else [1.0]
    return dict(zip(complementos, map(float, fatores)))


def sorteia_produtos(rng, cfg: dict, cores: list, n: int) -> list:
    """Sorteia n combinações únicas de tipo + complemento (+ cor), ordenadas por modelo."""
    usa_cor = cfg.get("usa_cor", True)
    combinacoes = [
        (t, c, cor)
        for t in cfg["tipos"]
        for c in cfg["complementos"]
        for cor in (cores if usa_cor else [None])
    ]
    if n > len(combinacoes):
        raise ValueError(f"Só há {len(combinacoes)} combinações; amplie tipos, complementos ou cores.")
    escolhidos = rng.choice(len(combinacoes), size=n, replace=False)
    produtos = [combinacoes[i] for i in escolhidos]
    # ordena pelo modelo (ordem de preço do tipo e do complemento), depois pela cor
    ordem_tipo = {t: i for i, t in enumerate(cfg["tipos"])}
    ordem_comp = {c: i for i, c in enumerate(cfg["complementos"])}
    return sorted(produtos, key=lambda p: (ordem_tipo[p[0]], ordem_comp[p[1]], p[2] or ""))


def main() -> None:
    params = yaml.safe_load(PARAMETROS.read_text(encoding="utf-8"))
    rng = np.random.default_rng(params["seed"])
    cfg_catalogo = params["catalogo"]
    fator_min, fator_max = cfg_catalogo["fator_complemento"]

    linhas = []
    for categoria, cfg in cfg_catalogo["categorias"].items():
        base = precos_base_por_tipo(cfg["preco"], cfg["tipos"],
                                    cfg_catalogo["quantil_minimo"], cfg_catalogo["quantil_maximo"])
        fator = fatores_por_complemento(cfg["complementos"], fator_min, fator_max)
        produtos = sorteia_produtos(rng, cfg, cfg_catalogo["cores"], cfg["skus"])
        popularidade = rng.lognormal(mean=0.0, sigma=cfg_catalogo["popularidade_sigma"], size=len(produtos))

        detalhes = cfg_catalogo["detalhes"][categoria]
        for i, (tipo, complemento, cor) in enumerate(produtos):
            publico = f" {concorda(PUBLICO[categoria], tipo, cfg_catalogo)}" if categoria in PUBLICO else ""
            variacao = concorda(complemento, tipo, cfg_catalogo)
            modelo = f"{tipo}{publico} {variacao}"
            preco = round(preco_de_varejo(base[tipo] * fator[complemento]), 2)

            # v2: descrição e ocasiões montadas por regra (nenhum sorteio novo)
            frase_tipo, ocasioes_tipo = detalhes[tipo]
            frase_variacao, ocasioes_variacao = cfg_catalogo["variacoes"][complemento]
            descricao = f"{frase_tipo} {frase_variacao}" + (f" Cor: {cor.lower()}." if cor else "")
            ocasioes = list(dict.fromkeys(ocasioes_tipo + ocasioes_variacao))   # une sem repetir

            linhas.append({
                "sku": f"HZ-{CODIGOS[categoria]}-{i + 1:03d}",
                "nome": f"{modelo} {cor}" if cor else modelo,
                "modelo": modelo,
                "categoria": categoria,
                "grupo": cfg["grupo"],
                "preco": preco,
                "custo": round(preco * (1 - cfg["margem"]), 2),
                "popularidade": round(float(popularidade[i]), 2),
                "tipo": tipo,
                "variacao": variacao,
                "cor": cor or "",
                "descricao": descricao,
                "ocasioes": ";".join(ocasioes),
                "imagem_url": cfg_catalogo["imagem_padrao"].format(categoria=slug(categoria), tipo=slug(tipo)),
            })

    catalogo = pd.DataFrame(linhas)

    # checagens antes de salvar
    assert catalogo["sku"].is_unique, "SKU duplicado"
    assert catalogo["nome"].is_unique, "nome duplicado"
    assert (catalogo["custo"] < catalogo["preco"]).all(), "custo maior ou igual ao preço"
    assert catalogo.notna().all().all(), "valor nulo no catálogo"
    assert (catalogo.groupby("modelo")["preco"].nunique() == 1).all(), "mesmo modelo com preços diferentes"

    saida = RAIZ / cfg_catalogo["arquivo_saida"]
    saida.parent.mkdir(parents=True, exist_ok=True)
    catalogo.to_csv(saida, index=False, encoding="utf-8", float_format="%.2f")

    # resumo: compara a mediana do catálogo com a do Olist, por categoria
    olist = {cat: cfg["preco"]["mediana"] for cat, cfg in cfg_catalogo["categorias"].items()}
    resumo = (catalogo.groupby(["grupo", "categoria"])
              .agg(skus=("sku", "count"), modelos=("modelo", "nunique"),
                   preco_min=("preco", "min"), mediana=("preco", "median"), preco_max=("preco", "max"))
              .reset_index())
    resumo["mediana_olist"] = resumo["categoria"].map(olist)
    print(f"Catálogo gerado: {saida.relative_to(RAIZ)} ({len(catalogo)} SKUs)\n")
    print(resumo.to_string(index=False))


if __name__ == "__main__":
    main()
