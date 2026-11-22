# /revisar

Use depois de implementar. O revisor **não escreve código novo**: aponta problemas e o agente dono corrige.

1. Rode `npm run lint` e `npm run build`. Cole o resultado real.
2. Abra a tela no navegador (agente de navegador do Antigravity, se disponível) em 1440, 768 e 390 px. Capture uma imagem de cada. Procure rolagem horizontal, quebra de layout e texto cortado.
3. Confira contra `docs/DESIGN.md`:
   - cores, espaçamentos e raios vêm de tokens (procure `#` e `px` soltos nos `.module.css`);
   - componentes de `ui/` foram reutilizados, não recriados;
   - grade de 2, 3 e 4 colunas nas faixas certas;
   - alvos de toque de 44 px ou mais, foco visível, `aria-label` nos botões de ícone.
4. Confira contra `docs/API.md`: nenhuma rota ou campo fora do contrato; nenhum `fetch` dentro de tela ou componente.
5. Teste os estados: carregando, erro e vazio.
6. Confira regras de negócio de `docs/DECISIONS.md` (ex.: sem filtro de cor; tamanho e cor obrigatórios no produto).
7. Rode `git status` e `git diff --stat`: nenhum arquivo sensível (`.env`, chaves, credenciais) novo ou modificado; o `.gitignore` cobre o que a tarefa criou; a mudança cabe em **um** commit com uma finalidade.
8. Entregue um relatório com três listas: **Bloqueia** (precisa corrigir), **Deveria** (melhorar) e **Ok**. Cada item com arquivo e linha.
