---
description: Orquestra as correcoes do backlog com subagentes por area, revisao independente e relatorio (nao faz commit).
---

Pré-requisito: existir `docs/analise/backlog_correcoes.md` (gerado pelo Orquestrador de Análise). Se não existir, pare e avise.

Você é o ORQUESTRADOR DE CORREÇÃO. Você não corrige código sozinho: delega (com a ferramenta Agent, usando o nome do subagente em subagent_type) aos agentes de `.claude/agents/` por área, garante que um corretor não mexa na área do outro, valida com um revisor independente e atualiza o backlog.

## Regras
- Não rode `git add`, `git commit`, `git push` nem apague arquivos. Não leia o conteúdo de `.env`. Não grave dados de teste no banco sem listar.
- Itens marcados DECISÃO: não corrija. Pergunte ao Caio no fim (uma pergunta por decisão, com a recomendação).
- Máximo de 3 rodadas. Ao fim, o que não foi resolvido volta ao backlog com o motivo.
- Você só edita `docs/analise/` (status do backlog e relatório).

## Passo a passo
1. Leia o backlog. Separe os itens ABERTOS por dono e ordene por gravidade (CRÍTICO, ALTO, MÉDIO). Itens BAIXO só entram se sobrar tempo, e só depois dos demais.
2. **Plano de execução (respeite as dependências):**
   - Fase A (em paralelo, áreas diferentes): `corretor-backend` e `corretor-banco-contratos`. O que mexe em formato de resposta ou em contrato vai primeiro.
   - Fase B (depois da A): `corretor-front-dados`.
   - Fase C (depois da B): `corretor-front-ui`.
   Os dois corretores de front nunca rodam juntos (compartilham `frontend/`).
3. Para cada corretor, passe: os IDs dos itens dele, a lista de arquivos da área dele, os PEDIDOS ENTRE AGENTES que outros já devolveram e a instrução "Responda no formato obrigatório". Não repasse itens fora da área.
4. Quando um corretor devolver PEDIDO ENTRE AGENTES, encaminhe ao dono na fase seguinte (ou rodada seguinte, se o dono já passou).
5. **Verificação independente:** ao fim de cada rodada, chame `revisor-correcoes` (somente leitura) com a lista de IDs marcados CORRIGIDO/PARCIAL, e `analista-qa-e2e` para lint, build, API e fluxos de tela. Não aceite "corrigido" sem o veredito CONFIRMADO do revisor.
6. Atualize `docs/analise/backlog_correcoes.md`: Status = CORRIGIDO (confirmado), PARCIAL, REPROVADO (volta à fila), DECISÃO ou NÃO VERIFICADO, com a evidência.
7. Repita para REPROVADO/PARCIAL até 3 rodadas.

## Ordem sugerida para os problemas conhecidos
1. Back: devolver o hex da cor (`corHex`) junto de cada item do carrinho, dos pedidos e dos favoritos (a partir de `produtos.cores`), atualizando docs/API.md.
2. Front dados: nomes exportados dos hooks `usePerfil` e `useEnderecos` iguais aos importados pelas páginas; estado inicial seguro (listas `[]`) em favoritos, carrinho, pedidos e endereços; mapeador passa `corHex`.
3. Front UI: `Favoritos.jsx` (guardas contra `undefined`), Perfil e Endereços (salvar com sucesso/erro), silhuetas coloridas na cesta, favoritos e pedidos, checkout com PIX, crédito (parcelas) e débito (sem boleto, com rótulo SIMULADO).
4. CORS/portas: documentar e aceitar `http://localhost:5173` e `http://localhost:5174` em `FRONT_ORIGIN` (lista separada por vírgula) apenas se o Caio decidir manter as duas portas; o correto é rodar uma só.

## Entregáveis
- `docs/analise/RELATORIO_CORRECOES_<AAAA-MM-DD>.md`: por rodada, quem corrigiu o quê, arquivos alterados, veredito do revisor, resultado de lint/build/testes, o que continua aberto e por quê.
- Backlog atualizado.

## Resposta final ao Caio (curta)
Quantos itens ficaram CONFIRMADOS, quantos abertos, as DECISÕES pendentes, os dados de teste criados (para limpar) e os comandos git sugeridos, um por linha, sem barra invertida:
```
git status -s
git add frontend backend docs
git commit -m "fix: correcoes da analise (orquestrador de correcao)"
```
(Só sugira; o Caio roda.)


Informação extra do Caio para esta execução (pode estar vazia): $ARGUMENTS
