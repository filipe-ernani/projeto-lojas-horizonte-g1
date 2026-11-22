"""Transforma a série diária de vendas do Olist num índice de sazonalidade.

Entrada:  data/referencia/olist_itens_diarios.csv
          (exportada do notebook 05_sazonalidade: itens válidos, do mix e no período
          completo, por dia, já com as datas deslocadas em 418 semanas)
Saída:    data/referencia/sazonalidade_diaria.csv

Por que um ÍNDICE e não a contagem bruta:
    o Olist cresceu cerca de 10x entre jan/2025 e 2026 (crescimento da própria plataforma).
    Usar a contagem bruta faria as lojas da Horizonte crescerem 10x em um ano.
    O índice divide cada dia pela tendência local (mediana móvel de 29 dias):
    1,0 = dia normal; 5,9 = Black Friday; 0,75 = sábado típico do online.

Uso (a partir da raiz do repositório):
    python data/geradores/prepara_sazonalidade.py
"""

from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parents[2]
ENTRADA = RAIZ / "data" / "referencia" / "olist_itens_diarios.csv"
SAIDA = RAIZ / "data" / "referencia" / "sazonalidade_diaria.csv"

JANELA_TENDENCIA = 29          # dias, centrada: longa o bastante para não ser puxada pela Black Friday
FIM_CONFIAVEL = "2026-08-25"   # depois disso a série despenca: é o corte de extração do Olist, não queda real de vendas

EVENTOS = {
    "2025-11-28": "Black Friday",
    # queda entre 25/05 e 05/06/2026 coincide com a greve dos caminhoneiros de maio/2018 (datas originais)
    **{d.strftime("%Y-%m-%d"): "Possível efeito da greve dos caminhoneiros (2018)"
       for d in pd.date_range("2026-05-25", "2026-06-05")},
}

DIAS = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"]


def main() -> None:
    serie = (pd.read_csv(ENTRADA, parse_dates=["data"])
             .set_index("data")
             .asfreq("D", fill_value=0))
    serie = serie.loc[:FIM_CONFIAVEL]

    serie["tendencia"] = serie["itens"].rolling(JANELA_TENDENCIA, center=True, min_periods=15).median()
    serie["indice"] = (serie["itens"] / serie["tendencia"]).round(3)
    serie["dia_semana"] = [DIAS[d] for d in serie.index.day_of_week]
    serie["evento"] = [EVENTOS.get(d.strftime("%Y-%m-%d"), "") for d in serie.index]

    saida = serie.reset_index()[["data", "dia_semana", "itens", "tendencia", "indice", "evento"]]
    saida["data"] = saida["data"].dt.strftime("%Y-%m-%d")
    saida.to_csv(SAIDA, index=False, encoding="utf-8")

    por_dia = serie.groupby("dia_semana")["indice"].median().reindex(DIAS).round(2)
    print(f"Gerado: {SAIDA.relative_to(RAIZ)} ({len(saida)} dias, "
          f"{saida['data'].iloc[0]} a {saida['data'].iloc[-1]})")
    print("Índice mediano por dia da semana:", por_dia.to_dict())
    print("Black Friday (2025-11-28):", serie.loc["2025-11-28", "indice"])


if __name__ == "__main__":
    main()
