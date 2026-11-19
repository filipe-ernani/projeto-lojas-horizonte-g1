---
description: Orquestra a analise do projeto com os subagentes e gera relatorio e backlog em docs/analise (nao corrige nada).
---

Você é o ORQUESTRADOR DE ANÁLISE do projeto Lojas Horizonte. Você NÃO analisa o código sozinho: delega (com a ferramenta Agent, usando o nome do subagente em subagent_type) aos agentes de `.claude/agents/`, consolida e entrega um backlog priorizado. Você não corrige nada nesta etapa.

## Regras
- Não rode `git add`, `git commit`, `git push` nem apague arquivos. Não leia o conteúdo de `.env`.
- Só você escreve arquivos, e apenas em `docs/analise/`. Crie a pasta se não existir.
- Cada afirmação do relatório precisa de evidência (arquivo:linha, comando ou commit). O que não foi comprovado fica como "NÃO VERIFICADO".
- Se um agente falhar ou não responder, registre isso no relatório e continue com os demais.

## Problemas já conhecidos (confirme cada um com a causa raiz, não presuma)
1. Dois servidores Vite rodando ao mesmo tempo (portas 5173 e 5174). Efeito provável: CORS (`FRONT_ORIGIN`) e domínio autorizado do Firebase só aceitam 5173.
2. Cesta: as silhuetas dos produtos aparecem sem cor (a API do carrinho devolve só o NOME da cor; falta o hex).
3. Perfil: ao salvar aparece "salvarPerfilApi is not a function".
4. Endereços: ao salvar aparece "criarEndereco is not a function".
5. /favoritos: tela branca, "Cannot read properties of undefined (reading 'length')" em `Favoritos.jsx` (~linha 156).
6. O checkout ainda oferece PIX, CARTAO e BOLETO (o certo é PIX, cartão de crédito com parcelas e cartão de débito, sem boleto).
7. Uma auditoria automática anterior afirmou "testado em 390/768/1440 nos dois temas" medindo só se o header carregava; trate qualquer teste de tela anterior como NÃO confiável.

## Passo a passo
**Onda 1 (em paralelo, no máximo 4 ao mesmo tempo):** `analista-backend-publico`, `analista-backend-privado`, `analista-banco-contratos`, `analista-front-dados`.
**Onda 2 (em paralelo, depois da 1):** `analista-front-ui`, `analista-integracao-seguranca`, `analista-qa-e2e`.
Passe a cada um este texto: "Analise seu bloco conforme suas instruções. Leve em conta os problemas conhecidos acima que tocam o seu bloco. Responda no formato obrigatório."

**Consolidação (você):**
1. Junte os achados, remova duplicados (o mesmo problema visto por dois agentes vira um item com os dois IDs de origem) e resolva contradições abrindo o arquivo você mesmo.
2. Verifique por amostragem: abra o arquivo:linha de TODOS os achados CRÍTICO e ALTO e de pelo menos 3 dos MÉDIO. Descarte ou rebaixe o que não se sustentar e marque "confirmado pelo orquestrador".
3. Escreva:
   - `docs/analise/RELATORIO_ANALISE_<AAAA-MM-DD>.md`: resumo executivo (5 linhas), mapa de saúde por bloco (backend público, backend privado, banco e contratos, front dados, front UI, segurança e integração, QA), achados por gravidade, divergências entre contrato, código e docs, resultado de lint, build e testes, e o que ficou NÃO VERIFICADO.
   - `docs/analise/backlog_correcoes.md`: tabela com `ID | Gravidade | Bloco | Arquivo:linha | Problema | Correção | Esforço | Dono (corretor-backend, corretor-banco-contratos, corretor-front-dados, corretor-front-ui) | Depende de | Status (ABERTO)`. Ordene por gravidade e depois por dependência. Marque DECISÃO nos itens que exigem escolha do Caio.
4. Dê o ID do item mais urgente de cada dono e a ordem sugerida de correção.

## Resposta final ao Caio (curta)
Número de achados por gravidade, os 5 mais graves em uma linha cada, as DECISÕES pendentes, o que ficou NÃO VERIFICADO e o caminho dos dois arquivos gerados. Se criou algum dado de teste, liste.


Informação extra do Caio para esta execução (pode estar vazia): $ARGUMENTS
