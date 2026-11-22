# Relatório de correções: Lojas Horizonte

**Data:** 2026-11-18 · **Branch:** dev · **Backlog:** [backlog_correcoes.md](backlog_correcoes.md)

## Resumo

| Status | Crítico | Alto | Médio | Baixo | Total |
|---|---:|---:|---:|---:|---:|
| Corrigido | 7 | 17 | 39 | 8 | 71 |
| Parcial | 0 | 1 | 2 | 0 | 3 |
| Adiado | 0 | 2 | 2 | 0 | 4 |
| Encerrado | 0 | 1 | 0 | 0 | 1 |
| Aberto | 0 | 0 | 14 | 23 | 37 |
| **Total** | 7 | 21 | 57 | 31 | 116 |

**Os fluxos de tela não foram testados pelos agentes.** Dependem do roteiro manual do Caio.

## Fases

| Fase | Commit | Corretores | Resultado | Revisão |
|---|---|---|---|---|
| 1. Banco e backend | `7db5d6b` | corretor-banco-contratos, corretor-backend | 29 corrigidos, 4 parciais, 4 adiados | Nenhum reprovado; 109 verificações em Postgres descartável |
| 2. Dados do front | `8277a42` | corretor-front-dados | 10 corrigidos, 7 parciais concluídos na Fase 3 | H-009 reprovado e confirmado na rodada 2 |
| 3. Telas | `3353ab3` | corretor-front-ui | 26 corrigidos, 1 parcial, 1 encerrado | Nenhum reprovado; QA sem falhas |
| 4. Docs e higiene | a comitar | corretor-banco-contratos, corretor-front-dados | 6 corrigidos | Nenhum reprovado |

## Itens que continuam pendentes

- **Parciais:** H-028, H-069, H-081.
- **Adiados (D8, D9, D10):** H-020, H-026, H-045, H-047.
- **Abertos:** H-033, H-052, H-053, H-055, H-062, H-065, H-070, H-071, H-072, H-073, H-074, H-075, H-076, H-084, H-086, H-087, H-088, H-089, H-090, H-091, H-092, H-093, H-094, H-095, H-096, H-097, H-098, H-099, H-100, H-101, H-102, H-106, H-107, H-109, H-113, H-115, H-116.
- **Ações do Caio:** H-053, H-081 (`docker compose up -d` em `backend/`), H-100 e H-101.

## NÃO VERIFICADO

- Fluxos de tela com login: favoritos, perfil, endereços, cesta, checkout e cancelamento.
- Responsividade, temas, contraste real e foco.
- `DATABASE_SSL=true`, por falta de servidor TLS.
- Comportamento real no Render.

## Dados de teste

Nenhum dado de teste foi criado no banco local nem no Firebase. Os testes de backend rodaram em contêineres descartáveis, já removidos.
