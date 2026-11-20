# Regra: definição de pronto

Nunca diga que terminou sem ter rodado e visto o resultado:

1. `npm run lint`: sem erro.
2. `npm run build`: sem erro.
3. A tela abre e funciona em 390, 768 e 1440 px, sem rolagem horizontal.
4. Estados de carregando, erro e vazio aparecem corretamente (sem back-end, o erro é o estado normal; para ver o vazio e o carregando, use uma página `_Teste` temporária com props).
5. Navegação por teclado: Tab chega a tudo que é clicável e o foco aparece.
6. Visual conferido contra `docs/DESIGN.md` (tokens, componentes, espaçamentos).
7. `docs/STATUS.md` atualizado pelo workflow `/handoff`.
8. `git status` sem arquivo sensível e **sugestão de commit** entregue (mensagem e comandos), conforme `.agent/rules/05-git-e-seguranca.md`.

Se algum item falhar, **diga qual falhou e por quê**. Não esconda nem marque como feito.

Ao terminar, escreva um resumo curto: o que foi criado, arquivos tocados, como testar e o que ficou pendente.
