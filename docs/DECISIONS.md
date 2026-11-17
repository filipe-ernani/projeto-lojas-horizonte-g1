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
