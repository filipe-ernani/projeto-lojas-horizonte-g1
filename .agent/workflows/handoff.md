# /handoff

Use ao terminar uma tarefa ou uma sessão. Objetivo: deixar `docs/STATUS.md` fiel ao que existe no código, para a próxima sessão (sua ou de outro agente) continuar sem adivinhar.

1. Liste o que mudou: confira os arquivos alterados no repositório (não confie na memória da conversa).
2. Rode `npm run lint` e `npm run build` e anote o resultado real.
3. Em `docs/STATUS.md`:
   - atualize "Última atualização", "Fase atual" e "Em andamento";
   - marque `[x]` só nas tarefas que passaram na definição de pronto;
   - acrescente em "Problemas conhecidos" tudo que está quebrado ou foi simplificado;
   - resolva ou acrescente itens em "Pedidos entre agentes";
   - acrescente uma linha em "Registro de sessões": data, o que foi feito, **commit sugerido** (a primeira linha da mensagem) e **próximo passo concreto**.
4. Se houve decisão nova (biblioteca, regra de negócio, mudança de contrato), acrescente em `docs/DECISIONS.md`.
5. Se o contrato de dados mudou, atualize `docs/API.md`.
6. **Arquivos sensíveis:** rode `git status`. Algum arquivo com senha, chave, token ou credencial aparece? Pare, coloque no `.gitignore` e avise o Caio antes de sugerir o commit. Confira também se o `.gitignore` cobre tudo que a tarefa criou (ver `.agent/rules/05-git-e-seguranca.md`).
7. **Sugestão de commit** (você **não** commita; o Caio commita). Entregue neste formato, com os arquivos realmente alterados:

````
Branch sugerida: feat/<nome>

```bash
git status
git add <arquivo1> <arquivo2> docs/STATUS.md
git commit -m "tipo(escopo): resumo curto

- o que mudou
- por que, se não for óbvio"
```
````

   Se a tarefa mexeu em coisas sem relação, sugira **mais de um commit**, um por assunto.
8. Termine com 3 linhas para o Caio: feito, pendente, próximo passo.

Nunca marque como feito o que não foi testado. Nunca apague registros antigos de `docs/DECISIONS.md`.
