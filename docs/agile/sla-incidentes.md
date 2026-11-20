# Acordo de Nível de Serviço (SLA) e Gestão de Incidentes

## 1. Métricas de SLO (Service Level Objective)
- **Disponibilidade (Uptime):** 99.9% para a API do Catálogo e Carrinho.
- **Latência:** p95 (95% das requisições) devem responder em menos de 500ms.

## 2. Fluxo de Resposta a Incidentes (Simulação de Black Friday)
1. **Detecção:** Monitorização de logs da aplicação (FastAPI) e alertas de falha na base de dados (PostgreSQL) disparam comunicação visual ou sonora para a equipa caso a API retorne erro 500 ou a latência (p95) ultrapasse 1s.
2. **Triagem:** O PMO aciona a equipa de Engenharia para classificar a severidade.
3. **Comunicação:** Atualização no painel de status para os clientes ("Site passando por instabilidade momentânea").
4. **Mitigação:** Escalar instâncias do Cloud Run (Autoscaling) ou aplicar Rollback de código.
5. **Post-Mortem:** Documentar a causa raiz em até 48 horas após a resolução.
