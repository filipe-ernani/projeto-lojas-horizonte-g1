# Histórico de Status Report Diário - Lojas Horizonte

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

---

## Daily 03 - 17/11/2026 (Mudança de Escopo IA & Design)
**Status do Projeto:** 🟡 Atenção (Mudança de Rota)

* **O que foi feito:** Apresentado e aprovado o design visual "Gold" (Emanuel/Caio) para o frontend. Camada Silver do ERP (fictício) concluída pelo Diego.
* **Em andamento:** 
  * Emanuel (IA): Finalização do pré-processamento de dados e implementação do BM25 para pesquisa.
  * Diego (Dados) & Caio (Front): Alinhamento das colunas da tabela de produtos do site com a camada de dados.
* **Bloqueios/Riscos:** As avaliações e descrições dos produtos não existem no dataset original e terão de ser geradas sinteticamente pelo Caio/Diego.
* **Decisões Estratégicas:** 
  1. **IA:** Alteração de escopo. A equipa focará primeiro na **Recomendação de Produtos** baseada no carrinho. A "Previsão de Demanda" foi rebaixada a funcionalidade opcional (condicionada ao tempo).
  2. **Regra de Negócio (Abandono):** Decidido que o abandono de carrinho não será um evento gravado diretamente na base de dados, mas sim um cálculo de BI (Henry) cruzando carrinhos abertos ("add to cart") vs carrinhos finalizados ("purchase").
  
---

## Daily 04 - 18/11/2026 (Integração de Dados & Pitch Deck)
**Status do Projeto:** 🔴 Risco de Prazo (Desenvolvimento avança para o fim de semana)

* **O que foi feito:** Apresentação da interface funcional (Frontend/Caio) com simulação de Pix, carrinho e listagem. Diagrama de fluxo de dados desenhado pelo Diego identificando os 5 KPIs obrigatórios. Estrutura da apresentação (Pitch Deck) definida.
* **Em andamento:** 
  * Diego (Dados): Construção da Camada Gold para unificar as métricas de receita, ticket médio, conversão e abandono.
  * Emanuel (IA) e Henry (BI): Geração de reviews sintéticos em conjunto para popular o RAG e o Dashboard.
* **Bloqueios/Riscos:** Agenda do Diego foi bloqueada por reuniões matinais, atrasando a entrega da Camada Gold. Este é um gargalo direto para Caio, Henry e Emanuel, o que forçará a equipa a codificar durante o final de semana para fechar a entrega.
* **Decisões Arquiteturais e de Escopo:** 
  1. Devido à complexidade e cota, a equipa não irá gerar as 200 imagens de produtos via IA. O Frontend usará *placeholders* (imagens genéricas em SVG) para fins de demonstração.
  2. Os dados da API do Frontend servirão apenas para simulação local; a camada Gold do Databricks será a verdadeira "fonte da verdade" do projeto.
