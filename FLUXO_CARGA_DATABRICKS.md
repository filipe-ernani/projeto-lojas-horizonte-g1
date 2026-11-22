# Fluxo de carga: site (Render) → Databricks

Como levar os dados novos do site hospedado até o Gold/dashboard. A integração é **em lote** (o Databricks Free Edition bloqueia conexão de saída), então o fluxo é: exportar CSVs do Postgres do Render e carregar no Volume do Databricks, que dispara o Job.

```
Site (Render) → Postgres Render → export:novos → CSVs → carga_ao_vivo.sh → Volume → Job (bronze→silver→gold) → dashboard
```

## Pré-requisitos (uma vez)

- Databricks CLI instalado e autenticado (`databricks jobs list` funciona).
- `node`, `npm` e `python3` instalados.
- Job: `horizonte_site_ao_vivo`, id **38847769689271**.
- URL **externa** do Postgres do Render (painel do banco → External Database URL). **Nunca** colar no chat, em commit ou no `.env`.

## Passo a passo

Use **uma única janela do Git Bash** do começo ao fim. Variáveis do PowerShell (`$env:`) não passam para o Git Bash.

### 1. Ir para a raiz do repositório

```
cd /c/projetos-lojas-horizonte/projeto-lojas-horizonte-g1
```

### 2. Apontar para o banco do Render

```
export DATABASE_URL='<URL externa do Render>'
export DATABASE_SSL=true
echo "$DATABASE_URL" | sed -E 's#:[^:@]+@#:***@#'
```

O host tem que ser `...render.com`. Se aparecer `localhost`, **pare**: o `.env` local seria usado e sairiam dados do banco errado.

### 3. Exportar só o que é novo

```
npm --prefix backend run export:novos
```

A saída lista, por tabela, quantos registros novos saíram e o carimbo dos arquivos (ex.: `2026-11-22T16-53-27-690Z`). Os CSVs ficam em `backend/exports/`. A marca d'água (`backend/exports/.marca.json`) avança a cada exportação: **não rode a exportação duas vezes seguidas à toa**.

Se todas as tabelas disserem 0 novos, não há nada a enviar: pare aqui.

### 4. Separar o lote numa pasta limpa

Troque `CARIMBO` pelo carimbo da saída do passo 3.

```
mkdir -p backend/envio-diego
cp backend/exports/*_CARIMBO.csv backend/envio-diego/
ls backend/envio-diego
```

Devem aparecer 4 arquivos (pedidos, pedido_itens, eventos, avaliacoes). A pasta só pode ter o lote atual: o script envia **todos** os CSVs que estiverem nela.

### 5. Testar sem enviar nada

```
SIMULAR=1 JOB_ID_AO_VIVO=38847769689271 bash databricks/carga_ao_vivo.sh backend/envio-diego
```

Confira as linhas por arquivo (iguais às do passo 3).

### 6. Carregar de verdade

```
JOB_ID_AO_VIVO=38847769689271 bash databricks/carga_ao_vivo.sh backend/envio-diego
```

O script envia cada CSV ao Volume, dispara o Job e acompanha até o fim. O resultado esperado é:

```
Job terminou: SUCCESS
Pronto: a gold está atualizada (o dashboard já pode ser recarregado).
```

### 7. Conferir e limpar

- Recarregar o dashboard (Henry) e conferir os novos pedidos/avaliações.
- Guardar o lote até confirmar o SUCCESS; depois: `rm -rf backend/envio-diego`.
- **Não reenviar o mesmo lote** (duplicaria no bronze).

## Se algo falhar

| Situação | O que fazer |
|---|---|
| Aparece `localhost` no passo 2 | Refazer os `export`; não exportar. |
| Erro de SSL na exportação | Banco errado (local) ou `DATABASE_SSL` faltando. |
| `No such file` no script | Rodar da **raiz** do repositório. |
| `<job_id>: No such file` | Usar o número real, sem `<>`. |
| Falha de autenticação do CLI | `databricks auth login` e repetir o passo 6. |
| Job terminou com falha | **Não reexportar** (a marca já avançou). Reenviar o mesmo lote do passo 6 depois de corrigir a causa; avisar o Diego com o link do run. |
| "Nada novo para enviar" | Comportamento correto: não há registros além do último lote. |

## Antes da apresentação (checklist)

1. Acordar o site e o agente (`/api/health`, `/list-apps`) ~10 min antes.
2. Fazer uma compra e uma avaliação no site hospedado.
3. Rodar os passos 1 a 7 uma vez no ensaio.
4. Deixar os `export` do passo 2 num bloco de notas para colar (fora do repositório).

## Observações para a banca

- Integração em lote por limitação do Free Edition; na arquitetura alvo (GCP) seria contínua (Pub/Sub ou conector direto ao banco).
- Os 31 eventos que o Diego carregou antes vieram do banco **local** (teste); os do site hospedado entram a partir do lote de 22/11.
- Rotacionar após a apresentação: senha do Postgres do Render (e atualizar `DATABASE_URL` do backend), token do Databricks e chave do Gemini.
