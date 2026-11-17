# Histórico de Status Report Diário - Lojas Horizonte (Grupo 1)

## Daily 01 - 13/11/2026 (Kick-off & Planeamento)
**Status do Projeto:** 🟢 No prazo

* **O que foi feito:** Kick-off do projeto, alinhamento do escopo de 5 dias úteis e estruturação inicial do quadro Kanban no GitHub.
* **Em andamento:** 
  * Diego (Dados): Iniciou a estruturação no Databricks e mapeamento das 3 fontes de dados (Olist, ERP fictício, Site).
  * Emanuel (IA): Iniciou a lógica base do agente de recomendação.
* **Bloqueios/Riscos:** Instabilidade global no Outlook impediu o recebimento de códigos de verificação, atrasando a configuração de acessos de alguns membros no GitHub.
* **Decisões Arquiteturais:** O banco de dados transacional para consumo da API será em PostgreSQL.

---

## Daily 02 - 16/11/2026 (Alinhamento Técnico & Gargalos)
**Status do Projeto:** 🟡 Atenção (Dependências encadeadas)

* **O que foi feito:** V1 do Frontend (Caio) apresentada com catálogo, filtros, carrinho e LGPD desenhados. Criação da branch intermediária `dev` aprovada pela equipa.
* **Em andamento:** 
  * Caio (Frontend): Geração de imagens fictícias dos produtos via IA para popular a interface.
  * Filipe (PMO): Elaboração da matriz de riscos e cálculo de custos da arquitetura GCP.
* **Bloqueios/Riscos:** Henry (BI) e Emanuel (IA) encontram-se bloqueados a aguardar a finalização da limpeza da base de dados por parte do Diego para conseguirem ligar o Dashboard e o RAG.
* **Decisões Arquiteturais:** Devido a limitações de ambiente na nuvem, a aplicação final vai rodar **localmente** no dia da apresentação. A arquitetura GCP e os custos serão entregues em formato de "Proposta Técnica" teórica para o cliente.
