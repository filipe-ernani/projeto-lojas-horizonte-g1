# Regra: Git, commits e arquivos sensíveis

## Quem faz o quê
- O agente **nunca** roda `git commit` nem `git push`. Quem commita é o Caio.
- O agente **sempre** entrega a sugestão de commit ao fim de cada tarefa concluída (via `/handoff`).

## Commits
- Um commit por tarefa, pequeno, com uma finalidade. Não junte features.
- Uma branch por feature: `feat/<nome>`.
- Mensagem em português, no imperativo, no formato:

```
tipo(escopo): resumo curto, até 72 caracteres

- o que mudou
- por que, se não for óbvio
```

- Tipos: `feat`, `fix`, `style`, `refactor`, `docs`, `chore`.
- Os commits servem de evidência do trabalho (o PMO audita o GitHub): mensagem clara, sem "ajustes" ou "wip".
- A sugestão vem com `git status` e `git add` de **arquivos específicos**, nunca `git add .` nem `git add -A`.

## Arquivos sensíveis
- Nunca versionar: `.env`, `.env.*` (exceto `.env.example`), chaves e credenciais (`*-firebase-adminsdk-*.json`, `serviceAccount*.json`, `*.pem`, `*.key`), `.firebase/`, logs, dados pessoais reais, `node_modules`, `dist`.
- Arquivo novo com senha, chave, token ou credencial: **primeiro** adicione ao `.gitignore`, **depois** avise o Caio. Isso vale mesmo que o arquivo ainda não exista no repositório.
- Antes de sugerir qualquer commit: `git status`. Se um arquivo sensível aparecer como novo ou modificado, **pare** e avise.
- Segredo já commitado: avise imediatamente. A chave deve ser revogada e trocada; apagar do histórico não basta.
- Nunca escreva segredo em código, em documentação, em exemplo ou em mensagem de commit. Use variável de ambiente (`import.meta.env.VITE_*`) e `.env.example` sem valor.
- Ferramentas locais (pastas do próprio Antigravity ou do editor) que gerem arquivos de cache ou credencial: confira no `git status` e ignore o que não for do projeto.
