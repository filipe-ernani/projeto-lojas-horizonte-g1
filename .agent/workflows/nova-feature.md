# /nova-feature

Use para construir uma tela ou funcionalidade completa em uma fatia vertical (da UI ao dado).

1. Rode `/retomar` (ou leia `docs/STATUS.md` e `docs/DECISIONS.md`).
2. Leia a seção da tela em `docs/DESIGN.md` e as rotas necessárias em `docs/API.md`.
3. **Plano curto** (5 a 10 linhas): quais arquivos serão criados, em qual pasta, qual agente é dono de cada um. Mostre ao Caio e espere a aprovação.
4. Camada de dados primeiro (agente Dados): função em `src/api/` e hook (só com o contrato confirmado; sem mocks). Use a skill `criar-hook-api`.
5. Componentes base que faltarem (agente Design): use a skill `criar-componente`. Não duplique o que já existe em `components/ui/`.
6. Página e componentes de negócio (agente UI): use as skills `criar-pagina` e `criar-componente`.
7. Rode `/revisar`.
8. Rode `/explicar` sobre o que foi feito.
9. Rode `/handoff`.

Regra: uma feature por vez. Não comece a próxima antes de fechar o `/handoff`.
