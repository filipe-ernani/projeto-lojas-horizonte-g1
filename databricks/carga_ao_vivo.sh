#!/usr/bin/env bash
# Carga ao vivo do site (issue #14): exporta da API o que é novo, envia ao Volume do
# Databricks e roda o Job horizonte_site_ao_vivo. É o "demo.sh" da apresentação.
#
# Uso (na raiz do repositório, na máquina onde rodam a API e o Postgres):
#   JOB_ID_AO_VIVO=<job_id> bash databricks/carga_ao_vivo.sh
#
# Para testar sem o banco, com CSVs já exportados numa pasta:
#   JOB_ID_AO_VIVO=<job_id> bash databricks/carga_ao_vivo.sh caminho/da/pasta
#
# Para ver o que seria feito, sem enviar nada nem rodar o Job:
#   SIMULAR=1 JOB_ID_AO_VIVO=<job_id> bash databricks/carga_ao_vivo.sh caminho/da/pasta
#
# Precisa de: node/npm (exportação), Databricks CLI autenticada e python3.

set -euo pipefail

JOB_ID="${JOB_ID_AO_VIVO:?Defina JOB_ID_AO_VIVO com o job_id do horizonte_site_ao_vivo}"
DESTINO="dbfs:/Volumes/horizonte/bronze/landing/site/api"
SIMULAR="${SIMULAR:-0}"

executar() {   # roda o comando, ou só mostra, em modo simulação
  if [ "$SIMULAR" = "1" ]; then echo "  [simulação] $*"; else "$@"; fi
}

# ---------------------------------------------------------------------------
# 1. Exportação: só o que mudou desde a última marca d'água
# ---------------------------------------------------------------------------
if [ $# -ge 1 ]; then
  PASTA="$1"
  echo "1. Usando os arquivos de $PASTA (sem exportar do banco)"
  ARQUIVOS=$(find "$PASTA" -maxdepth 1 -name '*.csv' | sort)
else
  PASTA="backend/exports"
  INICIO=$(mktemp)                       # marca o momento antes da exportação
  echo "1. Exportando da API os registros novos..."
  npm --prefix backend run export:novos
  ARQUIVOS=$(find "$PASTA" -maxdepth 1 -name '*.csv' -newer "$INICIO" | sort)
  rm -f "$INICIO"
fi

# ---------------------------------------------------------------------------
# 2. Envio ao Volume: cada arquivo na pasta da sua tabela
# ---------------------------------------------------------------------------
echo "2. Enviando ao Volume..."
ENVIADOS=0
for arquivo in $ARQUIVOS; do
  nome=$(basename "$arquivo")
  case "$nome" in
    pedidos_*)      tabela="pedidos" ;;
    pedido_itens_*) tabela="pedido_itens" ;;
    eventos_*)      tabela="eventos" ;;
    avaliacoes_*)   tabela="avaliacoes" ;;
    *) echo "   ignorado (nome desconhecido): $nome"; continue ;;
  esac
  linhas=$(( $(awk 'END { print NR }' "$arquivo") - 1 ))   # sem o cabeçalho (conta a última linha mesmo sem quebra no fim)
  if [ "$linhas" -le 0 ]; then
    echo "   sem registros novos: $nome"
    continue
  fi
  echo "   $nome → $tabela/ ($linhas linhas)"
  executar databricks fs mkdir "$DESTINO/$tabela"   # cria a pasta na primeira vez (se já existe, não faz nada)
  executar databricks fs cp "$arquivo" "$DESTINO/$tabela/$nome"
  ENVIADOS=$((ENVIADOS + 1))
done

if [ "$ENVIADOS" -eq 0 ]; then
  echo "Nada novo para enviar: o Job não foi disparado (economiza a cota)."
  exit 0
fi

# ---------------------------------------------------------------------------
# 3. Job: bronze e silver do site, unificação, gold e qualidade
# ---------------------------------------------------------------------------
echo "3. Disparando o Job $JOB_ID..."
if [ "$SIMULAR" = "1" ]; then
  echo "  [simulação] databricks jobs run-now $JOB_ID"
  exit 0
fi

RUN_ID=$(databricks jobs run-now "$JOB_ID" --no-wait --output json \
  | python3 -c 'import json, sys; print(json.load(sys.stdin)["run_id"])')

ler_execucao() {   # campo da execução: url, estado ou resultado
  databricks jobs get-run "$RUN_ID" --output json | python3 -c '
import json, sys
r = json.load(sys.stdin); campo = sys.argv[1]
if campo == "url": print(r["run_page_url"])
elif campo == "estado": print(r["state"]["life_cycle_state"])
else: print(r["state"].get("result_state", ""))' "$1"
}

echo "   Acompanhe: $(ler_execucao url)"
while true; do
  estado=$(ler_execucao estado)
  case "$estado" in
    TERMINATED|SKIPPED|INTERNAL_ERROR) break ;;
  esac
  echo "   $(date +%H:%M:%S) $estado..."
  sleep 15
done

resultado=$(ler_execucao resultado)
echo "Job terminou: $resultado"
[ "$resultado" = "SUCCESS" ] || exit 1
echo "Pronto: a gold está atualizada (o dashboard já pode ser recarregado)."
