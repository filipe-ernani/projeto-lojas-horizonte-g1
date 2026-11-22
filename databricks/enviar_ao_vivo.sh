#!/usr/bin/env bash
# Um comando: Render (Postgres) -> CSVs novos -> Volume do Databricks -> Job -> gold.
#
# Uso (Git Bash, de qualquer pasta):
#   bash databricks/enviar_ao_vivo.sh
#
# Precisa de databricks/.render.env com uma linha:  DATABASE_URL=<URL externa do Render>
# (arquivo local, fora do Git). Cada rodada guarda o seu lote em backend/lotes/<data-hora>.
# Se o envio falhar, o lote fica marcado como pendente e é reenviado sozinho na próxima rodada.
set -euo pipefail
cd "$(dirname "$0")/.."                       # sempre na raiz do repositório

JOB_ID_AO_VIVO="${JOB_ID_AO_VIVO:-38847769689271}"

if [ -z "${DATABASE_URL:-}" ] && [ -f databricks/.render.env ]; then
  set -a; . databricks/.render.env; set +a
fi
: "${DATABASE_URL:?Crie databricks/.render.env com a linha DATABASE_URL=... (URL externa do Render)}"
export DATABASE_URL DATABASE_SSL=true

PENDENTE="backend/lotes/.pendente"
mkdir -p backend/lotes

enviar() { JOB_ID_AO_VIVO="$JOB_ID_AO_VIVO" bash databricks/carga_ao_vivo.sh "$1"; }

# 0. Lote que ficou pendente de uma rodada que falhou
if [ -f "$PENDENTE" ]; then
  LOTE_PENDENTE=$(cat "$PENDENTE")
  echo "0. Reenviando o lote pendente: $LOTE_PENDENTE"
  enviar "$LOTE_PENDENTE"
  rm -f "$PENDENTE"
fi

# 1. Exportação (o próprio script confere o banco e aborta se for o errado)
LOTE="backend/lotes/$(date +%Y%m%dT%H%M%S)"
mkdir -p "$LOTE"
INICIO=$(mktemp)
echo "1. Exportando os registros novos do Render..."
npm --prefix backend run export:novos
find backend/exports -maxdepth 1 -name '*.csv' -newer "$INICIO" -exec cp {} "$LOTE"/ \;
rm -f "$INICIO"

if ! ls "$LOTE"/*.csv >/dev/null 2>&1; then
  echo "Nada novo no banco. Nada a enviar."
  rmdir "$LOTE"
  exit 0
fi

# 2. Envio e Job
echo "$LOTE" > "$PENDENTE"                    # só sai daqui quando o Job der SUCCESS
echo "2. Carregando o lote $LOTE no Databricks..."
enviar "$LOTE"
rm -f "$PENDENTE"
echo "Tudo certo: lote $LOTE carregado."