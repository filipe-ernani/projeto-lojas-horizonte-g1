-- 00 · Setup no BigQuery
-- Equivalente ao notebook pipeline/00_setup (D02):
--   catálogo horizonte          → projeto lojas-horizonte
--   schemas bronze/silver/gold  → datasets bronze/silver/gold
--   Volume horizonte.bronze.landing → bucket gs://lojas-horizonte-landing (criado pelo console ou gcloud, não por SQL)
--
-- Região: proposta São Paulo; em aberto até a estimativa de custos (D28, #35).

CREATE SCHEMA IF NOT EXISTS `lojas-horizonte.bronze` OPTIONS (location = 'southamerica-east1');
CREATE SCHEMA IF NOT EXISTS `lojas-horizonte.silver` OPTIONS (location = 'southamerica-east1');
CREATE SCHEMA IF NOT EXISTS `lojas-horizonte.gold`   OPTIONS (location = 'southamerica-east1');

-- Bucket (terminal, uma vez):
--   gcloud storage buckets create gs://lojas-horizonte-landing --location=southamerica-east1
--   gcloud storage cp -r data/saida/erp gs://lojas-horizonte-landing/erp
