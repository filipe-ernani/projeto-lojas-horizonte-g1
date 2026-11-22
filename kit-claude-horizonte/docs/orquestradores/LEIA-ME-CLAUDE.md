# Kit Claude Code: orquestradores e agentes (Lojas Horizonte)

## Instalação
Copie para a RAIZ do repositório (mesma pasta de `frontend/`, `backend/` e `docs/`):
- `.claude/agents/` (12 subagentes)
- `.claude/commands/` (2 comandos: os orquestradores)
- `.claude/settings.json` (permissões; se você já tem um, junte só o bloco `permissions`)

Abra o Claude Code na raiz, na branch `dev`, com Docker e API no ar. Se os subagentes não aparecerem, reinicie a sessão e rode `/agents` para conferir.

## Como usar
1. **Análise:** digite `/orquestrador-analise`. Resultado: `docs/analise/RELATORIO_ANALISE_<data>.md` e `docs/analise/backlog_correcoes.md`.
2. Leia o backlog e resolva as DECISÕES.
3. **Correção:** numa sessão nova, digite `/orquestrador-correcao`. Resultado: correções por área, revisão independente e `RELATORIO_CORRECOES_<data>.md`.
4. Você revisa o `git diff`, roda os comandos de commit sugeridos e faz o commit.

## Quem faz o quê
| Subagente | Papel | Edita? |
|---|---|---|
| analista-backend-publico | catálogo, busca, filtros, paginação | não |
| analista-backend-privado | auth, perfil, endereços, favoritos, carrinho, pedidos, eventos, chat | não |
| analista-banco-contratos | banco, migrações, views, contrato com o Diego | não |
| analista-front-dados | services, hooks, contextos, mapeadores | não |
| analista-front-ui | páginas, componentes, design, acessibilidade | não |
| analista-integracao-seguranca | segredos, git, dependências, docs x código, deploy | não |
| analista-qa-e2e | lint, build, API, fluxos de tela | não |
| corretor-backend | corrige backend/src e backend/scripts | sim |
| corretor-banco-contratos | corrige backend/db, integração e contratos | sim |
| corretor-front-dados | corrige services, hooks, context | sim |
| corretor-front-ui | corrige pages, components, styles | sim |
| revisor-correcoes | confere as correções com o diff real | não |

## Limites e cuidados
- O orquestrador é a **sessão principal**; no Claude Code um subagente não cria outros. É de propósito.
- O `settings.json` bloqueia leitura de `.env` e `git add/commit/push/reset` e `rm`. Quem faz o commit é você.
- Os analistas não têm as ferramentas de edição (só Read, Grep, Glob e Bash). Os corretores têm Edit e Write, mas só devem mexer na própria área (regra nas instruções deles).
- A permissão de `Bash` é a que você já usa; se ele pedir aprovação de algum comando, aprove só o que fizer sentido (lint, build, curl local).
- Cada análise completa consome bastante. Rode a análise uma vez e as correções em rodadas.
- Antes da entrega, limpe os dados de teste (Firebase, endereços, pedidos de homologação) e confira o `git status -s`.
