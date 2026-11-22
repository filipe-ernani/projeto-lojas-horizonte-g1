# Cola de véspera: Lojas Horizonte (Full Stack)

Detalhes e fontes de tudo isto em [RELATORIO_BANCA.md](RELATORIO_BANCA.md).

## Em uma frase

Fiz a loja virtual (React + Node/Express + PostgreSQL + Firebase Auth). Ela grava o funil de compra para os dados do Diego, exporta CSV com o cliente em hash e conversa com a IA do Emanuel por um proxy seguro.

## Números (medidos em 22/11)

| | |
|---|---|
| Commits | 165 no repositório, 70 meus |
| API | 29 rotas · 8 tabelas · 8 migrations |
| Front | 13 telas · React 19 + Vite 8 · CSS Modules |
| Catálogo | 200 produtos, 9 categorias |
| Qualidade | 116 achados na análise: 71 corrigidos, 37 abertos, 4 adiados |
| Testes | Sem suíte automatizada no front e no back · sem teste de carga · a IA tem 131 testes próprios |

## As 4 dores → minha resposta

1. **Pico / Black Friday:** API sem sessão no servidor, paginação, índices, health e limite de requisições. Plano com Cloud Run e Cloud SQL. **Não testei carga.**
2. **Dados espalhados:** o site exporta pedidos, itens, eventos e avaliações com colunas fixas, de forma incremental, para o Databricks do Diego.
3. **Abandono:** gravo `add_to_cart`, `begin_checkout`, `purchase` e a etapa do carrinho; o cálculo fica no BI do Henry.
4. **Personalização:** chat com a Hori (BM25 + Gemini) e produtos semelhantes da mesma categoria.

## Decisões-chave (frase para falar)

- **Sem mock:** "Nada na tela é inventado; o simulado está escrito SIMULADO." (D-19)
- **Eventos no servidor:** "Quem grava o evento é o servidor; se a compra falhar, o evento também não fica." (D-23, `6ec8469`)
- **Hash do cliente:** "Para os dados e para a IA, o cliente vira um código de 16 caracteres, nunca o e-mail."
- **Sem cartão:** "A rota ignora qualquer dado de cartão; o pagamento é simulado: Pix, crédito em 1 a 12x, débito." (D-12)
- **Preço:** "O banco guarda reais com duas casas; a conta é feita em centavos para não errar arredondamento."
- **Só comprador avalia:** "O servidor exige pedido finalizado com aquele produto; uma avaliação por produto."
- **Chat via proxy:** "O navegador nunca fala com a IA; meu servidor valida, limita e só deixa passar o texto final."
- **Tokens de teste:** "Só com a flag ligada e nunca em produção. Era um achado crítico e corrigimos."
- **Frete:** "Fixo de R$ 15, configurável e simulado." (D-27)
- **CSS:** "O briefing pedia CSS puro; CSS Modules é CSS com escopo por componente." (D-02)
- **Agentes de IA:** "Regras em arquivo, cada agente na sua pasta, nenhum faz commit: todo commit passou por mim." (D-17)

## Não diga (é falso ou não verificado)

- "Testamos carga" ou "aguenta X usuários": **não medido**.
- "API em FastAPI" ou "Locust": o README está errado; é Node/Express.
- "Centavos no banco": é `NUMERIC(10,2)` em reais.
- "Recomendação no carrinho": não existe no front.
- "100% testado": um relatório antigo de agente dizia isso e estava errado.

## 15 perguntas mais prováveis

1. **E se o Render cair?** O site para; hoje é uma instância. Os dados ficam no banco, não no servidor. Na nuvem ideal, Cloud Run sobe outra instância e o Cloud SQL tem réplica.
2. **Como garantem que só comprador avalia?** O servidor busca um pedido FINALIZADO do usuário com aquele SKU; sem ele, 403. Regra única no banco: uma por produto.
3. **E a Black Friday?** Não testamos carga. O plano: teste com k6 antes, mínimo de instâncias alto, máximo limitado pelas conexões do banco, Redis, e desligar o chat antes da compra.
4. **Por que Postgres e não Firestore?** Pedido, itens e endereço são relacionais e a compra precisa de transação com trava; Postgres garante. O Firebase ficou no login.
5. **Por que CSS puro?** Pedido do briefing. CSS Modules dá escopo por componente; os tokens fazem os temas claro e escuro.
6. **Como a IA recomenda?** Busca por palavras (BM25) no catálogo e nas avaliações da gold e escreve com o Gemini. Não é busca semântica.
7. **LGPD?** Guardo o mínimo, senha no Firebase, cartão nunca, hash para dados e IA. Falta exclusão a pedido do titular, retenção e salt no hash.
8. **Quanto custaria?** Não inventei preço: calculadora do GCP com instâncias, Cloud SQL, tráfego, BigQuery e Gemini. O PMO tem uma estimativa sem link.
9. **Por que não ligar o Databricks direto no banco?** Para não pesar o banco da loja e mandar só colunas permitidas, com hash. É por rota com chave ou por CSV incremental.
10. **O que NÃO fizeram?** Teste de carga, testes automatizados, pagamento real, estoque, deploy com configuração versionada, recomendação no carrinho, contrato formal.
11. **E se o preço mudar até pagar?** A compra cobra o preço atual do banco; o total sempre é calculado no servidor.
12. **Clique duplo gera dois pedidos?** Não: transação com `FOR UPDATE`; o segundo encontra a cesta vazia (400). O purchase não duplica.
13. **E se a IA cair na demo?** O chat mostra "indisponível agora" e a loja continua funcionando.
14. **Como usaram IA para programar?** Agentes com regras em arquivo, revisão independente e commit sempre meu. Os agentes erraram (relatório "100% aprovado" falso); só aceito o que tem evidência.
15. **O que é uma sessão no funil?** Um código por aba; muda depois de cada compra e após 30 min parado. O primeiro evento é sempre `session_start`.

## Demo (aquecer 10 min antes)

1. Banco no Docker, `db:migrate`, API (`/api/health` respondendo) e front.
2. Agente `adk api_server`; fazer **uma pergunta de aquecimento** antes da banca.
3. Fluxo: catálogo → filtro → produto (tamanho e cor) → favorito → cesta → Pix → meus pedidos → avaliar → chat com a Hori.
4. **Plano B:** vídeo gravado e capturas de cada passo. Se a IA cair, mostrar o aviso de indisponível e seguir.
