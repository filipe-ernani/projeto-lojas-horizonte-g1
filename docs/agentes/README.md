# Agentes do front-end

Quatro papéis. Você (Caio) é o **orquestrador**: aprova planos, decide prioridades e roda `/handoff`. O Antigravity (Agent Manager) abre as conversas; cada agente é uma conversa com um prompt de papel.

| Agente | Arquivo | Pastas que edita | Faz |
|---|---|---|---|
| **UI** | `ui-builder.md` | `components/` (exceto `ui/`), `pages/`, `routes/` | Telas e componentes de negócio |
| **Dados** | `data-builder.md` | `api/`, `context/`, `hooks/`, `utils/`, `firebase.js` | API, hooks, Context, login |
| **Design** | `design-guardian.md` | `styles/`, `components/ui/`, `docs/DESIGN.md` | Tokens, componentes base, consistência visual |
| **Revisor** | `reviewer.md` | nenhuma (só lê e relata) | Lint, build, navegador, checklist |

**Contexto não é um agente.** A "memória de desenvolvimento" são os arquivos de `docs/` (`STATUS.md`, `DECISIONS.md`, `API.md`, `DESIGN.md`, `PROJECT.md`), atualizados pelos workflows `/handoff` e `/retomar`. Arquivo versionado não alucina; resumo gerado por modelo pode errar.

## Como usar no Antigravity

1. Abra o repositório como workspace. `AGENTS.md` na raiz e `.agent/` (rules, workflows, skills) são lidos pelos agentes. **Confira na documentação do Antigravity os caminhos atuais**; se sua versão usar outros nomes de pasta, mova os arquivos de `.agent/` e mantenha o `AGENTS.md` na raiz.
2. Abra uma conversa por agente e comece colando: `Atue como o agente <nome>. Siga docs/agentes/<arquivo>.md e rode /retomar.`
3. Peça sempre uma tarefa pequena e fechada, por exemplo: "Crie o componente `Chip` conforme `docs/DESIGN.md`".
4. Ao final de cada tarefa: `/revisar`, `/explicar`, `/handoff`.

## Ordem recomendada

1. **Design:** tokens (já prontos no kit) e componentes `ui/`.
2. **Dados:** `utils`, `client.js` e Firebase Auth (login). Sem mocks; hooks de dados só quando o dataset chegar.
3. **UI:** Home, Catálogo, Produto.
4. Repita por fatia: Login, Favoritos, Carrinho, Perfil, Checkout, Pedidos, Chat.

## Paralelo sem conflito

- Cada agente edita só as próprias pastas.
- Dois agentes ao mesmo tempo? Use um branch por agente (`git switch -c feat/ui-catalogo`) e junte depois, ou rode em sequência.
- Cota do Antigravity curta? Comece com **UI + Revisor** e deixe Dados e Design como "chapéus" que você mesmo alterna, seguindo os mesmos arquivos de regra.

## Pedidos entre agentes

Um agente que precisa de algo na pasta de outro **não edita**. Escreve em `docs/STATUS.md` > "Pedidos entre agentes" (de quem, para quem, o quê) e avisa você.
