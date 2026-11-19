# Roteiro da Apresentação (Pitch) - Lojas Horizonte
*Tempo Total Estimado: 15 a 20 minutos*

## 1. Abertura e Visão de Negócio (Filipe) - 3 min
* A dor do cliente: Site instável na Black Friday e relatórios manuais da diretoria.
* A Proposta de Valor do MVP: Plataforma de Dados unificada com recomendação inteligente.
* A Arquitetura Proposta: Como seria no GCP (Cloud Run + BigQuery) vs O que fizemos no MVP.

## 2. Fundação: Engenharia de Dados (Diego) - 3 min
* Explicação do Pipeline Medallion no Databricks.
* Como resolvemos a junção das 3 fontes (ERP, Olist, Site).
* Apresentação rápida da tabela Gold com os KPIs agregados.

## 3. A Vitrine: Frontend e API (Caio) - 4 min
* Demonstração ao vivo do site rodando localmente (Navegação, Filtros, Carrinho, Checkout simulado via Pix).
* Demonstração de captura do evento "Add to Cart" que alimenta o banco de dados.

## 4. O Cérebro: Inteligência Artificial (Emanuel) - 3 min
* Apresentação da Recomendação de Produtos no carrinho.
* Explicação técnica de como o RAG consulta as avaliações sintéticas para sugerir itens combinados.

## 5. A Visão Diretiva: Business Intelligence (Henry) - 3 min
* Apresentação do Databricks Dashboard.
* Explicação da regra de negócio para calcular o "Abandono de Carrinho" cruzando cliques e checkouts.
* Demonstração dos indicadores de Receita e Ticket Médio.

## 6. Encerramento (Filipe) - 2 min
* Simulação de Gestão de Incidentes (Como agiríamos se a API caísse na Black Friday).
* Conclusões finais e agradecimentos à Banca.
