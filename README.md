# Projeto Integrador - Plataforma de Dados e IA para Lojas Horizonte

## 1. Visão Geral do Projeto
Este repositório contém o projeto de modernização tecnológica e implementação de inteligência artificial para as Lojas Horizonte, desenvolvido pelo Grupo 1[cite: 1, 2]. O cliente é uma rede de moda composta por 12 lojas físicas e um e-commerce em fase de crescimento[cite: 2]. O projeto tem como objetivo migrar os sistemas para o Google Cloud, garantindo escalabilidade, e construir uma plataforma unificada de dados com recursos de IA[cite: 2].

## 2. Dores do Cliente e Problemas Resolvidos
O desenvolvimento deste MVP foca em solucionar os seguintes gargalos operacionais e de negócio identificados no cliente[cite: 2]:
* Instabilidade e lentidão do site em datas de pico de acesso, como a Black Friday, chegando a apresentar 40 minutos de inatividade[cite: 2].
* Fragmentação de dados espalhados entre o ERP, o site e marketplaces, resultando em uma falta de visão unificada sobre vendas, estoque e margens[cite: 2].
* Alto índice de abandono de carrinho sem acompanhamento ou análise estruturada[cite: 2].
* Ausência de personalização e recomendação inteligente de produtos para os usuários[cite: 2].

## 3. Escopo da Solução (MVP)
Para mitigar os problemas levantados, a squad desenvolveu um Protótipo Funcional (MVP) focado em dados e escalabilidade[cite: 2]. A solução é composta por:
* **Aplicação Web:** Loja demonstrativa contemplando catálogo, carrinho e finalização de pedido[cite: 2].
* **Pipeline de Dados:** Ingestão e tratamento de dados unificando clientes, pedidos e pagamentos, resolvendo valores nulos[cite: 1].
* **Inteligência Artificial:** Sistema RAG não-vetorial (recuperador lexical, TF-IDF ou OKAPI BM25) integrado ao catálogo e às avaliações (reviews) para atuar no suporte ao cliente[cite: 1].
* **Business Intelligence:** Dashboard gerencial com indicadores estratégicos, incluindo receita, ticket médio, taxa de conversão, abandono de carrinho e giro de estoque[cite: 2].

## 4. Arquitetura e Stack Tecnológica
Em conformidade com as regras de risco e custo zero, o projeto adota um modelo híbrido entre o desenho ideal na nuvem e a execução prática[cite: 1]:

### 4.1. Arquitetura Conceitual (Google Cloud)
Desenho técnico projetado para suportar o ambiente de produção real com alta disponibilidade[cite: 1, 2]:
* **Armazenamento e Banco de Dados:** Cloud SQL para dados transacionais e integração de fontes[cite: 2].
* **Data Warehouse:** BigQuery para consolidação das fontes (ERP, site, marketplace)[cite: 2].
* **Processamento e Hospedagem:** App Engine ou GKE (Google Kubernetes Engine) com autoscaling para lidar com picos de tráfego[cite: 2].

### 4.2. Execução Prática (Stack Obrigatória)
Ambiente de testes e prototipação utilizado para demonstrar a solução funcionando[cite: 1]:
* **Engenharia de Dados e BI:** Databricks Community Edition (Pipeline Medallion e dashboards AI/BI)[cite: 1].
* **Inteligência Artificial:** Agent Development Kit (ADK) executado via comando `adk web`[cite: 1].
* **Desenvolvimento e Versionamento:** VS Code e GitHub[cite: 1].
* **Dataset Base:** Brazilian E-Commerce Public Dataset by Olist (Kaggle)[cite: 1].

## 5. Equipe e Responsabilidades (Squad 1)
A governança e execução do projeto foram divididas entre as seguintes áreas e responsáveis[cite: 1]:

* **PMO (Filipe):** Responsável pela governança estrutural do GitHub, condução do Relatório Ágil Diário (Dailies), mapeamento operacional e gestão da matriz de riscos[cite: 1].
* **Engenharia de Dados (Diego):** Responsável por desenvolver o Pipeline Medallion (camadas Bronze, Silver, Gold), unificando bases de pedidos, clientes e pagamentos, além de realizar a limpeza de dados e resolução de nulos[cite: 1].
* **Engenharia de IA (Emanuel):** Responsável por construir o sistema RAG não-vetorial de suporte ao cliente, consultando diretamente o catálogo de produtos e as reviews[cite: 1].
* **Desenvolvimento FullStack (Caio):** Responsável por estruturar a aplicação web (catálogo e carrinho) e realizar sua integração com o modelo de inteligência artificial desenvolvido[cite: 1].
* **BI & Analytics (Henry):** Responsável por desenvolver o Databricks Dashboard gerencial consumindo as tabelas Gold, fornecendo visibilidade sobre abandono de carrinho, ticket médio e cancelamentos[cite: 1].

## 6. Governança e Cronograma Ágil
O acompanhamento do projeto é realizado através de Relatórios Ágeis Diários durante o ciclo de 5 dias úteis de execução[cite: 1, 3]. Todo o mapeamento de tarefas, controle de bloqueios e progresso individual encontra-se registrado no quadro Kanban (Projects) deste repositório, garantindo rastreabilidade e transparência.
