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
- **Aplicação Web:** Loja demonstrativa (API local + Postgres) contemplando catálogo, carrinho e finalização de pedido.
- **Pipeline de Dados:** Ingestão e tratamento de dados unificando clientes, pedidos e pagamentos das 3 fontes (ERP, site, Olist).
- **Inteligência Artificial:** Sistema de recomendação de produtos em tempo real (ADK + BM25), sugerindo itens adicionais ao cliente com base nos produtos adicionados ao carrinho e avaliações geradas sinteticamente. (Previsão de demanda mantida no roadmap futuro).
- **Business Intelligence:** Dashboard AI/BI e alerta automatizado no Google Sheets com 8 indicadores estratégicos (Receita, Ticket Médio, Conversão, Giro de Estoque, etc).

## 4. Arquitetura e Stack Tecnológica
Adotamos um modelo híbrido entre o desenho ideal na nuvem e a execução prática obrigatória do MVP:

### 4.1. Arquitetura Conceitual (Google Cloud)
Desenho projetado para suportar produção real com alta disponibilidade:
- **Hospedagem API:** Cloud Run escalando horizontalmente em picos de requisição, dispensando GKE/App Engine.
- **Banco Transacional:** Cloud SQL for PostgreSQL (HA + réplica de leitura).
- **Data Warehouse:** BigQuery consumindo via Cloud Storage e Datastream (CDC).

### 4.2. Execução Prática (Stack Obrigatória)
Ambiente de testes utilizado para demonstrar a solução:
- **Dados e BI:** Databricks Free Edition com Unity Catalog (Pipeline Medallion).
- **IA e Modelagem:** Agent Development Kit (ADK) via `adk web` e MLflow.
- **Dataset:** Brazilian E-Commerce Public Dataset by Olist e geradores sintéticos em Python.

## 5. Equipe e Responsabilidades
- **PMO (Filipe):** Governança ágil, condução das Dailies, mapeamento de riscos, gestão de resposta a incidentes (SLA 99.9%) e estimativa de custos na GCP Pricing Calculator.
- **Engenharia de Dados (Diego):** Pipeline Medallion (Bronze, Silver, Gold), arquitetura GCP, geradores de dados sintéticos e matriz de acessos (IAM).
- **Engenharia de IA (Emanuel):** Modelo de previsão de demanda semanal no MLflow e desenvolvimento do agente interno Analista Horizonte no ADK.
- **FullStack (Caio):** API FastAPI (catálogo e carrinho), plano de autoscaling, testes de carga com Locust e integração de alertas no Gmail.
- **BI & Analytics (Henry):** Dicionário de métricas, Databricks AI/BI Dashboard e relatórios automatizados consumindo a camada Gold.

## 6. Governança e Cronograma Ágil (5 Dias)
O acompanhamento do projeto é realizado através do Kanban neste repositório.

| Dia | Foco | Entregáveis Principais |
| :--- | :--- | :--- |
| **Dia 1** | Planejamento | Setup do GitHub, contas Databricks, leitura inicial do Olist. |
| **Dia 2** | Desenho e Contratos | Diagrama GCP, contrato da camada Gold, schema da API. |
| **Dia 3** | Construção | Camadas Bronze/Silver prontas, API no ar, V1 do Dashboard. |
| **Dia 4** | Integração | Camada Gold final, Agente IA conectado, teste de carga, documentação. |
| **Dia 5** | Validação | Pitch Deck, ensaio da simulação de incidente e apresentação final. |
