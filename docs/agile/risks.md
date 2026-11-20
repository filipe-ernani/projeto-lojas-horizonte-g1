# Matriz de Riscos e Mitigações

| Risco | Impacto | Probabilidade | Estratégia de Mitigação |
| :--- | :--- | :--- | :--- |
| **Limitações do Databricks Free** | Alto | Alta | Arquitetura local em paralelo; focar apenas nas camadas Bronze/Silver/Gold essenciais. |
| **Cota da API do Gemini (ADK)** | Médio | Média | Uso de cache em respostas repetidas e limitação de requisições por minuto durante os testes. |
| **Problemas de conexão com Banco Local** | Alto | Baixa | Utilizar Docker Compose para garantir que as portas do PostgreSQL subam de forma consistente em todas as máquinas. |
| **Atraso na geração do Dataset** | Alto | Baixa | Escopo reduzido do Olist; geração de dados sintéticos simplificada para focar na estrutura Medallion. |
