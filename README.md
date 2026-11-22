# Projeto Integrador - Plataforma de Dados e IA para Lojas Horizonte

## 1. Visão Geral do Projeto
Este repositório contém o projeto de modernização tecnológica e implementação de inteligência artificial para as Lojas Horizonte, desenvolvido pelo Grupo 1. O cliente é uma rede de moda composta por 12 lojas físicas e um e-commerce em fase de crescimento. O projeto tem como objetivo migrar os sistemas para o Google Cloud, garantindo escalabilidade em picos de acesso, e construir uma plataforma unificada de dados com recursos de IA para previsão de demanda.

## 2. Dores do Cliente e Problemas Resolvidos
O desenvolvimento deste MVP foca em solucionar os seguintes gargalos operacionais e de negócio:
- Instabilidade e lentidão do site na última Black Friday, chegando a apresentar 40 minutos de inatividade total.
- Fragmentação de dados espalhados entre o ERP, o site e marketplaces; com a diretoria montando relatórios manuais em planilhas.
- Alto índice de abandono de carrinho sem acompanhamento ou análise estruturada.
- Nenhuma personalização ou previsão de vendas para antecipar picos de demanda.

## 3. Escopo da Solução (MVP)
Para mitigar os problemas, a squad desenvolveu um Protótipo Funcional (MVP) focado em dados e escalabilidade:
- **Aplicação Web:** Loja demonstrativa (API local + Postgres) contemplando catálogo, carrinho, autenticação e finalização de pedido.
- **Pipeline de Dados:** Ingestão e tratamento de dados unificando clientes, pedidos e pagamentos das 3 fontes (ERP, site, Olist).
- **Inteligência Artificial:** Agente conversacional "Ori" (ADK + BM25) para suporte avançado ao cliente, e modelo de previsão de demanda focado na redução de ruptura de estoque.
- **Business Intelligence:** Dashboard AI/BI automatizado com os 5 indicadores estratégicos obrigatórios (Receita, Ticket Médio, Conversão, Abandono de Carrinho e Giro de Estoque).

## 4. Arquitetura e Stack Tecnológica
Adotamos um modelo híbrido entre o desenho ideal na nuvem e a execução prática obrigatória do MVP:

### 4.1. Arquitetura Conceitual (Google Cloud)
Desenho projetado para suportar produção real com alta disponibilidade:
- **Hospedagem API:** Cloud Run escalando horizontalmente em picos de requisição, dispensando GKE/App Engine.
- **Banco Transacional:** Cloud SQL for PostgreSQL (HA + réplica de leitura).
- **Data Warehouse e Auth:** BigQuery consumindo via Cloud Storage, e Firebase Authentication para login seguro e escalável.

### 4.2. Execução Prática (Stack Obrigatória)
Ambiente de testes utilizado para demonstrar a solução:
- **Dados e BI:** Databricks Free Edition com Unity Catalog (Pipeline Medallion).
- **IA e Modelagem:** Agent Development Kit (ADK) via `adk web` e MLflow.
- **Integração MVP:** Aplicação inteiramente integrada via Docker Compose na máquina local.
- **Dataset:** Brazilian E-Commerce Public Dataset by Olist e geradores sintéticos em Python.

## 5. Equipe e Responsabilidades
- **PMO (Filipe):** Governança ágil, condução das Dailies, mapeamento de riscos, gestão de resposta a incidentes (SLA 99.9%) e estimativa de custos no GCP.
- **Engenharia de Dados (Diego):** Pipeline Medallion (Bronze, Silver, Gold), arquitetura de dados e geradores de dados sintéticos para simulação de vendas.
- **Engenharia de IA (Emanuel):** Desenvolvimento do assistente inteligente "Ori" no ADK com pesquisa Lexical e modelo de previsão de demandas para o painel.
- **FullStack (Caio):** API FastAPI e interface Web Frontend integrados via Docker Compose, sistema de autenticação e simulação de escalabilidade.
- **BI & Analytics (Henry):** Dicionário de métricas, modelagem de dados para análise e Databricks AI/BI Dashboard consumindo a camada Gold.

## 6. Governança e Cronograma Ágil
O projeto foi estruturado utilizando a metodologia ágil, com o desenvolvimento planejado para uma Sprint de 5 dias úteis. O acompanhamento micro das tarefas, bloqueios e relatórios diários (Dailies) está documentado no nosso quadro Kanban e na pasta `docs/agile/`.

| Sprint | Foco | Entregáveis Planejados |
| :--- | :--- | :--- |
| **Dia 1** | Planejamento & Setup | Kick-off do projeto, estruturação do repositório no GitHub, setup do Databricks e análise exploratória do dataset. |
| **Dia 2** | Desenho & Arquitetura | Padronização do Kanban, desenho da arquitetura GCP e criação dos primeiros protótipos do Frontend. |
| **Dia 3** | Construção (Dados & Web) | Finalização do pipeline de ingestão (Camadas Bronze e Silver) e implementação do catálogo/carrinho na aplicação Web. |
| **Dia 4** | Integração (IA & BI) | Consolidação da Camada Gold, integração do Agente de IA (Ori) e construção do Dashboard de Indicadores (AI/BI). |
| **Dia 5** | Validação & Entrega | Testes de integração (Docker Compose), validação das regras de negócio, construção do Pitch Deck e ensaio da apresentação. |
