# Proposta de Arquitetura em Nuvem (GCP)
*Nota do PMO: O MVP Lojas Horizonte foi construído e executado localmente via Docker Compose devido a restrições de sandbox. Este documento serve como Proposta Técnica e Estimativa de Custos para o ambiente de Produção do Cliente.*

## 1. Componentes da Arquitetura
Para suportar datas de pico (ex: 11/11 ou Black Friday), sem apresentar inatividade ou lentidão, a infraestrutura ideal no Google Cloud será:
- **Cloud Run:** Hospedagem da aplicação Web e API FastAPI. Escolhido por permitir auto-scaling instantâneo a partir de zero, absorvendo picos sem intervenção manual.
- **Cloud SQL (PostgreSQL):** Banco de dados relacional para lidar com o alto volume de inserções da tabela `analytics_events` e catálogo de produtos em Alta Disponibilidade (HA).
- **BigQuery:** Data Warehouse empresarial. Receberá dados paralelamente para as análises de BI e cálculo do Abandono de Carrinho sem onerar o banco de produção.
- **Firebase Authentication:** Serviço serverless gerido escolhido para a autenticação segura de utilizadores (Google e E-mail/Senha) de forma escalável.

## 2. Estimativa Mensal de Custos (GCP Pricing Calculator)
**Premissas utilizadas para o cenário base (Crescimento de Ecommerce):**
- *Cloud Run:* 4 vCPU, 8GB RAM, estimativa de 5 instâncias ativas durante 30% do mês.
- *Cloud SQL:* 1 instância Enterprise for PostgreSQL (4 vCPU, 16GB RAM) + 100 GB de armazenamento SSD.
- *BigQuery:* 50 GB de armazenamento ativo e 500 GB de processamento de queries/mês.
- *Firebase Authentication:* Escalável gratuitamente até 50.000 MAUs (Monthly Active Users).

**Total Estimado:** ~ $ 450,00 USD / mês (Custos do Firebase absorvidos no Free Tier para a dimensão atual).
**Link da Estimativa Detalhada:** [Clique aqui para acessar a simulação no GCP](COLE_O_SEU_LINK_GERADO_AQUI_OU_INDIQUE_O_PDF)
