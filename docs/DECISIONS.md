# DECISIONS.md — Decisões já tomadas

> Registro curto. Agentes **não reabrem** uma decisão daqui sem o Caio pedir. Para decidir algo novo, acrescente uma linha no fim com data e motivo.

| # | Data | Decisão | Motivo |
|---|---|---|---|
| D-01 | 13/11 | Front em React + Vite com **JSX** (sem TypeScript) | Caio prefere JSX; o grupo usa JavaScript |
| D-02 | 13/11 | Estilo com **CSS Modules** + tokens em `tokens.css` | O briefing pede "CSS puro"; CSS Modules é CSS comum com escopo local. Confirmar com a coordenação |
| D-03 | 13/11 | Stack enxuta: sem Zod, TanStack Query, MSW, React Hook Form, axios | Prazo curto e Caio está aprendendo; cada biblioteca nova é risco |
| D-04 | 13/11 | Dados via `fetch` nativo, Context API e hooks próprios | Mesmo motivo de D-03 |
| D-05 | 13/11 | ~~Mock primeiro~~ **Substituída por D-19** | — |
| D-06 | 13/11 | Filtros do catálogo: **preço, tamanho, categoria**. Sem cor, marca e estilo | Pedido do Caio; marca e estilo não existem nos dados |
| D-07 | 13/11 | Produto: escolher **tamanho** (número em calçados) e **cor** | Pedido do Caio |
| D-08 | 13/11 | **Favoritos** (coração) entram no escopo | Pedido do Caio |
| D-09 | 13/11 | Endereços em **tabela própria** ligada ao usuário; o checkout escolhe um | Pedido do Caio (normalização) |
| D-10 | 13/11 | Login com **Google e e-mail/senha** (sem Apple e Facebook) | Firebase gratuito; Apple e Facebook exigem contas extras |
| D-11 | 13/11 | Recuperar senha por **link** enviado pelo Firebase | O Firebase não envia código de verificação |
| D-12 | 13/11 | Checkout **simulado** (Pix, Cartão, Boleto sem cobrança real) | Escopo do MVP |
| D-13 | 13/11 | Design web em 1440 px (canvas) e mobile no Figma; CSS escrito mobile-first | O Figma só tinha mobile |
| D-14 | 13/11 | Sem marcas reais nem fotos de pessoas reais; produto sem imagem usa placeholder | Direitos de imagem |
| D-15 | 14/11 | Contexto do projeto em arquivos (`docs/`), sem "agente de memória" | Arquivos versionados não alucinam; resumo gerado por modelo pode errar |
| D-16 | 14/11 | Cada agente só edita as próprias pastas (ver `AGENTS.md`) | Evita conflito entre agentes em paralelo |
| D-17 | 14/11 | Ao fim de cada tarefa o agente entrega **sugestão de commit** (formato `tipo(escopo): resumo`); quem commita é o Caio | Registro do que foi feito e evidência no GitHub para o PMO |
| D-19 | 14/11 | **Sem dados mockados.** O front entrega estrutura, componentes, rotas, login e estados (carregando, erro, vazio); os dados vêm da API real quando o dataset e o back-end existirem. O back-end fica para depois | Pedido do Caio: esperar o dataset do outro integrante |
| D-18 | 14/11 | Arquivos sensíveis sempre no `.gitignore` antes de qualquer commit; `git status` obrigatório antes de sugerir commit | Evitar vazamento de chaves |
| D-20 | 16/11 | Header: navegação só com Início e Catálogo; deslogado vê Entrar e Cadastre-se; ícones de favoritos, cesta e conta só para usuário logado | Simplificação da navegação (o coração já leva a /favoritos) e adaptação da interface ao estado de autenticação |
| D-21 | 17/11 | Estoque fora do escopo do MVP (fica na arquitetura de escalabilidade conceitual). Tamanhos, cores e descrições são gerados no seed e marcados como SIMULADO. | Pedido do Caio: reduzir complexidade. |
| D-24 | 17/11 | Identidade visual: paleta terrosa (terracota `#C9795D`/`#E08E70`, marrom café `#6B4E3D`, creme `#FAF7F2`), temas claro e escuro via atributo `data-theme` em `<html>`, tipografia Jost (Google Fonts 400-700) e ThemeToggle acessível | Alinhamento com a identidade da marca Horizonte, contraste WCAG AA/AAA e suporte a tema claro e escuro |
| D-20 (emenda) | 17/11 | Header: navegação central com Início (`/`), Novidades (`/#novidades`), Masculino (`/catalogo?categoria=Masculino`) e Feminino (`/catalogo?categoria=Feminino`); ThemeToggle integrado; deslogado vê Entrar e Cadastre-se; logado vê favoritos, cesta e conta | Alinhamento com a arquitetura de navegação da marca |
| D-25 | 17/11 | Seção `#novidades` e parâmetro `ordenar=novidades`: retorna o SKU mais recente (maior ordem) de CADA categoria, no máximo `limite` itens (padrão 8), ordenados do mais novo para o mais antigo; critério SIMULADO | Vitrine de novidades com diversidade de categorias destacando as últimas peças cadastradas |
| D-26 | 17/11 | Páginas públicas legais e institucionais (`/institucional`, `/privacidade`, `/termos`, `/cookies`) com aviso acadêmico no topo e transparência sobre Firebase Auth, localStorage de tema e cabeçalho `X-Sessao-Id` | Transparência, conformidade e profissionalismo na entrega do projeto acadêmico |
| D-24 (revisão) | 17/11 | Refinamento dos tokens alinhado a `horizonte-design-system.svg`, introdução de `--color-field-border` para contraste >= 3:1 em inputs/chips/buttons outline, `--color-logo`, componente `Logo` vetorial oficial em `components/ui/` e inicialização de tema no `<head>` do `index.html` | Correções da revisão de design system, conformidade estrita WCAG AA (1.4.11) e eliminação total de FOUC |
| D-22 | 17/11 | Identificador público do produto no catálogo e rotas da API é o SKU (`id = sku`) | Evita IDs numéricos artificiais e unifica a chave de busca do front-end com os dados reais do catálogo |
| D-23 | 17/11 | Eventos de analytics para o pipeline de BI são registrados pela camada de back-end; o front-end apenas transmite o identificador de sessão no cabeçalho `X-Sessao-Id` | Centralização e consistência na gravação de eventos de navegação, carrinho e compra sem sobrecarregar a camada visual |
| D-27 | 17/11 | Frete simulado: valor fixo configurado via variável `FRETE_SIMULADO` no `.env` (padrão R$ 15,00), cobrado quando há itens no carrinho; sem promessa de frete grátis | Simplicidade e honestidade no MVP demonstrativo sem integração com transportadoras reais |
| D-28 | 17/11 | Contrato de integração com agente de IA (ADK): endpoint provisório encaminha `{ mensagem, sessaoId }` para `ADK_URL` via POST com timeout de 20s; pendente de confirmação com o Emanuel | Desacoplamento da infraestrutura de IA e proteção com fallback gracioso 503 |
