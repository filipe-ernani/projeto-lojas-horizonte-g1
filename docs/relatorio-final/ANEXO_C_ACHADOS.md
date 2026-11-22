# Anexo C: os 116 achados da análise e seu status

Gerado por script a partir de [docs/analise/backlog_correcoes.md](../analise/backlog_correcoes.md) (coluna "Problema" resumida em até 150 caracteres; status copiado da última coluna). Total de linhas: 116. Comando de conferência: `grep -oE "^| H-[0-9]{3}" docs/analise/backlog_correcoes.md | sort -u | wc -l` → 116.

"tela NÃO VERIFICADA" significa que o código foi corrigido e conferido pelo revisor, mas a tela não foi aberta em navegador.

Voltar ao [relatório](RELATORIO_PROJETO.md).

| ID | Gravidade | Área | Problema (resumo) | Status |
|---|---|---|---|---|
| H-001 | CRÍTICO | Segurança e integração | [D3] Tokens `test:` e `mock:` autenticam qualquer uid sem verificação quando `NODE_ENV` difere de `production`. | CORRIGIDO (revisor: CONFIRMADO) |
| H-002 | CRÍTICO | Segurança e integração | [D2] Valor literal de X-API-Key em script versionado e publicado em `origin/dev` (valor omitido neste relatório). | CORRIGIDO (revisor: CONFIRMADO) |
| H-003 | CRÍTICO | Front UI | Problema conhecido 5: /favoritos fica em tela branca. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-004 | CRÍTICO | Front UI | Problema conhecido 3: salvar perfil falha com "salvarPerfilApi is not a function". | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-005 | CRÍTICO | Front UI | Problema conhecido 4, maior que o relatado: criar, editar e excluir endereço falham. Sem endereço, a compra não finaliza. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-006 | CRÍTICO | Front UI | Cancelar pedido gera TypeError: a página pede `cancelarPedido` e `cancelando`, que o hook não devolve. | CORRIGIDO (revisor: CONFIRMADO) |
| H-007 | CRÍTICO | Front dados | Os botões + e − da cesta sempre gravam quantidade 1. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-008 | ALTO | Front dados | Alterar ou remover um item afeta todas as variantes do mesmo SKU. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-009 | ALTO | Front dados | Perda de dados: adicionar antes do GET terminar, ou depois de ele falhar, parte de `itens=[]` e o PUT substitui a cesta no servidor. | CORRIGIDO (revisor: CONFIRMADO) |
| H-010 | ALTO | Front dados | Salvar perfil troca o formulário pelo skeleton; em falha, mostra "Não foi possível carregar seu perfil" e perde o que foi digitado. | CORRIGIDO (revisor: CONFIRMADO) |
| H-011 | ALTO | Front dados | `carregando` nunca liga na carga: a tela mostra "cesta vazia" ou "sem pedidos" enquanto os dados chegam. | CORRIGIDO (revisor: CONFIRMADO) |
| H-012 | ALTO | Front dados | "Tentar de novo" não sai da tela de erro, mesmo quando a nova busca dá certo. | CORRIGIDO (revisor: CONFIRMADO) |
| H-013 | ALTO | Front dados | Falha ao alterar item grava no mesmo `erro` da carga e derruba a página inteira da cesta, do checkout ou dos favoritos. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-014 | ALTO | Backend privado | [D5] Problema conhecido 2, parte da API: carrinho e pedidos devolvem só o nome da cor. | CORRIGIDO (revisor: CONFIRMADO) |
| H-015 | ALTO | Front UI | Problema conhecido 2, parte do front: o mapeador descarta o hex e os componentes não passam `cor`. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-016 | ALTO | Front UI | Sem ErrorBoundary, qualquer erro de renderização vira tela branca. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-017 | ALTO | Front UI | [D6] O chat sempre mostra "indisponível" e nunca chama a API. | ENCERRADO (D6: o widget não muda) |
| H-018 | ALTO | Front dados | O evento `begin_checkout` nunca é gerado, e o funil do pipeline fica sem essa etapa. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-019 | ALTO | Backend privado | O evento `add_to_cart` compara quantidades só por SKU: variantes se sobrescrevem e eventos somem ou são inventados. | CORRIGIDO (revisor: CONFIRMADO) |
| H-020 | ALTO | Banco e contratos | [D9] O contrato `SCHEMA_PIPELINE_v1.1.md` não existe no disco nem no git, e `docs/` está ignorado. | ADIADO (D8, D9 ou D10) |
| H-021 | ALTO | Banco e contratos | Não há migrações: `init.sql` só roda com volume vazio, e no Render nada cria as tabelas. | CORRIGIDO (revisor: CONFIRMADO) |
| H-022 | ALTO | Banco e contratos | [D1] Problema conhecido 6, parte do banco: o CHECK aceita PIX, CARTAO e BOLETO, e `parcelas` não existe na tabela, na view nem no CSV. | CORRIGIDO (revisor: CONFIRMADO) |
| H-023 | ALTO | Backend privado | [D1] Problema conhecido 6, parte da API: a finalização aceita boleto e não trata débito nem parcelas. | CORRIGIDO (revisor: CONFIRMADO) |
| H-024 | ALTO | Front UI | [D1] Problema conhecido 6, parte da tela: o checkout oferece boleto e não tem débito nem parcelas. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-025 | ALTO | Banco e contratos | [D9] A exportação incremental pode perder linhas em silêncio. | CORRIGIDO (revisor: CONFIRMADO) |
| H-026 | ALTO | Banco e contratos | [D10] A saída simulada não segue o contrato de colunas e inclui carrinhos ativos. | ADIADO (D8, D9 ou D10) |
| H-027 | ALTO | Segurança e integração | O Express não serve `frontend/dist` nem tem SPA fallback, o que impede o deploy único no Render. | CORRIGIDO (revisor: CONFIRMADO) |
| H-028 | ALTO | Segurança e integração | Não há suporte a `DATABASE_SSL`, necessário para banco gerenciado. | PARCIAL (código CONFIRMADO; DATABASE_SSL=true NÃO VERIFICADO) |
| H-029 | MÉDIO | Segurança e integração | [D4] Problema conhecido 1, hipótese de CORS refutada: `FRONT_ORIGIN` não tem efeito e qualquer origem é aceita com credenciais. | CORRIGIDO (revisor: CONFIRMADO) |
| H-030 | MÉDIO | Front dados | [D4] Problema conhecido 1, causa da segunda porta: sem `strictPort`, o Vite sobe em 5174 quando 5173 está ocupada. | CORRIGIDO (revisor: CONFIRMADO) |
| H-031 | MÉDIO | Backend público | Paginação não inteira, valores gigantes e byte NUL geram 500 em vez de 400. | CORRIGIDO (revisor: CONFIRMADO) |
| H-032 | MÉDIO | Backend público | Filtros inválidos falham em silêncio e de forma incoerente. | CORRIGIDO (revisor: CONFIRMADO) |
| H-033 | MÉDIO | Backend público | A busca não trata acento, espaços nem múltiplas palavras. | ABERTO |
| H-034 | MÉDIO | Backend público | [D11] "Ver catálogo completo" leva a `ordenar=novidades`, que mostra 1 SKU por categoria e não existe no seletor. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-035 | MÉDIO | Backend público | [D11] "Melhor avaliados" ordena por popularidade, sem avaliação real. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-036 | MÉDIO | Backend público | Pool sem listener `error` e sem timeouts. | CORRIGIDO (revisor: CONFIRMADO) |
| H-037 | MÉDIO | Backend privado | `PUT /api/carrinho` com `{}` ou `itens` inválido apaga o carrinho e responde sucesso. | CORRIGIDO (revisor: CONFIRMADO) |
| H-038 | MÉDIO | Backend privado | Dois primeiros PUTs simultâneos podem violar o índice único do carrinho ativo. | CORRIGIDO (revisor: CONFIRMADO) |
| H-039 | MÉDIO | Backend privado | Cancelamento sem transação: SELECT e UPDATE separados, e o UPDATE filtra só por `id`. | CORRIGIDO (revisor: CONFIRMADO) |
| H-040 | MÉDIO | Backend privado | IDs e itens malformados devem gerar 500 em vez de 400 ou 404. | CORRIGIDO (revisor: CONFIRMADO) |
| H-041 | MÉDIO | Backend privado | Criações simultâneas podem gerar dois endereços padrão. | CORRIGIDO (revisor: CONFIRMADO) |
| H-042 | MÉDIO | Backend privado | Validação fraca de endereço e perfil: tamanho, UF, telefone e tipos. | CORRIGIDO (revisor: CONFIRMADO) |
| H-043 | MÉDIO | Backend privado | O handler registra o erro inteiro; em JSON malformado ele carrega o corpo bruto, que pode ter dados pessoais. | CORRIGIDO (revisor: CONFIRMADO) |
| H-044 | MÉDIO | Backend privado | [D7] A cesta exibe o preço gravado, mas a finalização cobra o preço atual, sem aviso. | CORRIGIDO (revisor: CONFIRMADO) |
| H-045 | MÉDIO | Backend privado | [D8] O pedido não guarda cópia do endereço: editar ou excluir altera o histórico. | ADIADO (D8, D9 ou D10) |
| H-046 | MÉDIO | Backend privado | O telefone não pode ser apagado: string vazia mantém o valor anterior, e o front mostra sucesso. | CORRIGIDO (revisor: CONFIRMADO) |
| H-047 | MÉDIO | Banco e contratos | [D9] Na API de integração, `>=` repete a última linha, e a paginação não avança se `limite` linhas tiverem o mesmo `updated_at`. | ADIADO (D8, D9 ou D10) |
| H-048 | MÉDIO | Banco e contratos | `npm run seed:simulado` deve falhar: usa `require` em pacote ESM. | CORRIGIDO (revisor: CONFIRMADO) |
| H-049 | MÉDIO | Banco e contratos | O CSV não coloca aspas em campo com `\r` isolado. | CORRIGIDO (revisor: CONFIRMADO) |
| H-050 | MÉDIO | Banco e contratos | `desde` inválido e `limite=1.5` não são validados. | CORRIGIDO (revisor: CONFIRMADO) |
| H-051 | MÉDIO | Banco e contratos | [D12] Schema paralelo divergente e sem uso. | CORRIGIDO (revisor: CONFIRMADO) |
| H-052 | MÉDIO | Banco e contratos | Faltam CHECKs de valores monetários, quantidade em eventos e coerência entre status e datas. | ABERTO |
| H-053 | MÉDIO | Segurança e integração | Exports de homologação estão versionados apesar de ignorados. | ABERTO (ação do Caio) |
| H-054 | MÉDIO | Banco e contratos | `docs/API.md` diverge do código em formatos, campos e status HTTP. | CORRIGIDO (revisor: CONFIRMADO) |
| H-055 | MÉDIO | Front dados | O evento de sessão expirada não tem ouvinte, e um 401 sem JSON nem chega a dispará-lo. | ABERTO |
| H-056 | MÉDIO | Front dados | Ao sair, o estado não é limpo, e o próximo usuário pode herdar a cesta anterior. | CORRIGIDO (revisor: CONFIRMADO) |
| H-057 | MÉDIO | Front dados | Cliques rápidos usam estado antigo, e respostas fora de ordem desfazem alterações. | CORRIGIDO (revisor: CONFIRMADO) |
| H-058 | MÉDIO | Front UI | Ações assíncronas sem `catch` geram rejeição não tratada. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-059 | MÉDIO | Front dados | Ao trocar de produto ou filtro, erro, dados e cor escolhida anteriores permanecem. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-060 | MÉDIO | Front UI | O telefone salvo pode aparecer vazio no formulário. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-061 | MÉDIO | Front UI | A paginação lista todas as 17 páginas sem quebra de linha e deve estourar a largura. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-062 | MÉDIO | Front UI | O header deve estourar em 390 px. | ABERTO |
| H-063 | MÉDIO | Front UI | `<main>` dentro de `<main>` e margem lateral dobrada. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-064 | MÉDIO | Front UI | Roupa infantil aparece como "Número (calçado)". | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-065 | MÉDIO | Front UI | O resumo de avaliações nunca aparece. | ABERTO (nenhum defeito identificado no front; a rota de avaliações devolve resumo zerado) |
| H-066 | MÉDIO | Front UI | [D11] Novidades e descrições sem rótulo SIMULADO, e o texto promete envio ao Brasil todo. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-067 | MÉDIO | Front UI | Produto sem cor ou tamanho mostra rótulo vazio. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-068 | MÉDIO | Front UI | Chave React duplicada com duas variantes do mesmo SKU. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-069 | MÉDIO | Front UI | Grupos de opção com semântica errada ou sem nome. | PARCIAL (só PaymentOptions; demais grupos pendentes) |
| H-070 | MÉDIO | Front UI | Foco invisível no botão do chat. | ABERTO |
| H-071 | MÉDIO | Front UI | Filtro fechado no mobile continua recebendo foco por Tab. | ABERTO |
| H-072 | MÉDIO | Front UI | Texto secundário reprova AA no tema claro. | ABERTO |
| H-073 | MÉDIO | Front UI | Link focável dentro de `aria-hidden="true"`. | ABERTO |
| H-074 | MÉDIO | Front UI | Campo de senha sem borda visível. | ABERTO |
| H-075 | MÉDIO | Front UI | Botão dentro de link: HTML inválido. | ABERTO |
| H-076 | MÉDIO | Front UI | Alvos de toque abaixo de 44 px. | ABERTO |
| H-077 | MÉDIO | Front dados | Ao filtrar não há indicação de carga, e cada dígito do preço dispara uma busca. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-078 | MÉDIO | Front UI | "Limpar filtros" não faz nada quando o vazio vem da busca. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-079 | MÉDIO | Segurança e integração | [D13] Sem rate limit global e sem `trust proxy`. | CORRIGIDO (revisor: CONFIRMADO) |
| H-080 | MÉDIO | Segurança e integração | Sem headers de segurança, e `X-Powered-By` segue ativo. | CORRIGIDO (revisor: CONFIRMADO) |
| H-081 | MÉDIO | Segurança e integração | Postgres publicado em todas as interfaces, com senha padrão como fallback. | PARCIAL (arquivo CONFIRMADO; contêiner ainda em 0.0.0.0:5433) |
| H-082 | MÉDIO | Segurança e integração | [D12] `docs/` está ignorado, mas 14 documentos seguem rastreados. Documentos novos ficam fora do git. | CORRIGIDO (revisor: CONFIRMADO) |
| H-083 | MÉDIO | Segurança e integração | Faltam padrões para service account, `*.pem` e `*.key`. | CORRIGIDO (revisor: CONFIRMADO) |
| H-084 | MÉDIO | Segurança e integração | `npm audit --omit=dev`: 4 altas no frontend e 4 na raiz (`@grpc/grpc-js`); backend sem achados. | ABERTO |
| H-085 | MÉDIO | Segurança e integração | Documentação desatualizada, incluindo a afirmação de testes em 390/768/1440 (problema conhecido 7). | CORRIGIDO (revisor: CONFIRMADO) |
| H-086 | BAIXO | Backend público | O health responde `ok` sem consultar o banco. | ABERTO |
| H-087 | BAIXO | Backend público | Erros 4xx expõem mensagens internas em inglês. | ABERTO |
| H-088 | BAIXO | Backend público | `%` e `_` na busca funcionam como curingas. | ABERTO |
| H-089 | BAIXO | Backend público | [D12] O campo `imagens` do checklist não existe na API. | ABERTO |
| H-090 | BAIXO | Backend público | Cor desconhecida vira marrom sem aviso. | ABERTO |
| H-091 | BAIXO | Backend privado | Coleções em memória crescem sem limite, e o token é verificado duas vezes. | ABERTO |
| H-092 | BAIXO | Backend público | Sem índice para preço, tamanhos ou busca textual. | ABERTO |
| H-093 | BAIXO | Backend privado | Quantidade aceita `true` e `[3]`. | ABERTO |
| H-094 | BAIXO | Backend privado | `sessaoId` do corpo vai ao ADK sem validação. | ABERTO |
| H-095 | BAIXO | Backend privado | `FRETE_SIMULADO=0` vira R$ 15,00, e a regra está duplicada. | ABERTO |
| H-096 | BAIXO | Banco e contratos | Faltam índices em chaves estrangeiras. | ABERTO |
| H-097 | BAIXO | Banco e contratos | [D12] `pedidos.usuario_id` não tem FK para `usuarios`. | ABERTO |
| H-098 | BAIXO | Banco e contratos | `session_start` pode duplicar em requisições simultâneas. | ABERTO |
| H-099 | BAIXO | Banco e contratos | Gera CSV só com cabeçalho e salva a marca apenas no fim. | ABERTO |
| H-100 | BAIXO | Segurança e integração | [D14] Dados de homologação precisam ser limpos antes da extração. | ABERTO (ação do Caio) |
| H-101 | BAIXO | Front dados | `frontend/.env` não é usado, pois o Vite lê a raiz. | ABERTO (ação do Caio) |
| H-102 | BAIXO | Front dados | `auth/unauthorized-domain` não tem tradução. | ABERTO |
| H-103 | BAIXO | Front dados | [D12] Código sem uso e pasta duplicada. | CORRIGIDO (revisor: CONFIRMADO) |
| H-104 | BAIXO | Front dados | Import dinâmico sem efeito e bundle JS de 541,58 kB. | CORRIGIDO (revisor: CONFIRMADO) |
| H-105 | BAIXO | Front dados | Resposta 200 com formato inesperado vira lista vazia. | CORRIGIDO (revisor: CONFIRMADO) |
| H-106 | BAIXO | Front dados | Item novo aparece por instantes com nome vazio e preço 0. | ABERTO |
| H-107 | BAIXO | Front dados | O debounce de 300 ms só atrasa a busca. | ABERTO |
| H-108 | BAIXO | Front UI | Cores claras somem no tema claro e escuras no tema escuro. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-109 | BAIXO | Front UI | Desvios das regras de estilo: `!important`, `rgba` soltos e um hex no JSX. | ABERTO |
| H-110 | BAIXO | Front UI | A cor entra sem validação em `dangerouslySetInnerHTML`. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-111 | BAIXO | Front UI | Endereço salvo sem mensagem de sucesso. | CORRIGIDO (revisor: CONFIRMADO; tela NÃO VERIFICADA) |
| H-112 | BAIXO | Front UI | Documentos citam boleto e divergem do código. | CORRIGIDO (revisor: CONFIRMADO) |
| H-113 | BAIXO | QA | Não há script `test` nem arquivos de teste automatizado. | ABERTO |
| H-114 | BAIXO | Segurança e integração | O exemplo traz valores e não lista `NODE_ENV` nem `DATABASE_SSL`. | CORRIGIDO (revisor: CONFIRMADO) |
| H-115 | BAIXO | Segurança e integração | `usuario_hash` é SHA-256 truncado sem salt. | ABERTO |
| H-116 | BAIXO | Segurança e integração | Dependências na raiz, incluindo `axios`, vedado pela decisão do projeto. | ABERTO |
