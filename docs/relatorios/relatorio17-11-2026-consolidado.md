# Relatório Geral de Evolução e Qualidade — Identidade Visual, Telas e Back-end (Tarefa B1)

**Data:** 17/11/2026  
**Projeto:** Lojas Horizonte (`projeto-lojas-horizonte-g1`)  
**Agentes Envolvidos:** Design (`design-guardian`), UI (`ui-builder`), Back-end (`data-builder`)  
**Branches:** `frontend`, `backend`  
**Fase Atual:** Transição da Fase 3 (Estrutura das Telas) para a Fase 4 (Integração com a API)  
**Status Consolidado:** 100% aprovado nos testes técnicos e auditorias de código  

---

## 1. Resumo Executivo

Este relatório consolida todas as entregas realizadas no projeto **Lojas Horizonte** no dia **17/11/2026**, cobrindo o período imediatamente posterior ao relatório de simplificação do Header (`relatorio17-11-2026-header.md`, commit `aba12c8`) até a conclusão e validação da **Tarefa B1** do back-end (commit `c12af20` e ajustes de ambiente).

Neste intervalo, o projeto alcançou marcos estruturantes cruciais antes do congelamento de código previsto para 20/11:
1. **Identidade Visual e Design System Completo (Decisão D-24 e revisão):** implantação da fonte oficial **Jost**, sistema de temas Claro/Escuro por tokens semânticos, eliminação de FOUC com script inline no `<head>`, componente vetorial oficial `<Logo />` e botão acessível `<ThemeToggle />`.
2. **Refinamento de Telas e Rotas Legais (Decisões D-20 emendada, D-25 e D-26):** modernização do Header, Footer institucional, Home com seção dinâmica `#novidades` (8 últimos SKUs), Faixa de Pilares honestos e páginas públicas `/institucional`, `/privacidade`, `/termos` e `/cookies`.
3. **Qualidade e Acessibilidade nas Telas Centrais:** ajuste de rolagem no Login para telas baixas (`min-height: 100dvh`), campos desativados de leitura e edição no Perfil (`/perfil`), modularização do Checkout e interface do assistente virtual `<ChatWidget />` com foco acessível.
4. **Infraestrutura e Back-end PostgreSQL (Tarefa B1 — Decisões D-21, D-22 e D-23):** orquestração com Docker Compose, esquema relacional `loja` estruturado, script de seed idempotente para 200 produtos do catálogo real (`catalogo.csv`) e API REST pura em Express + Node.js (sem ORM) na porta 3000 com queries parametrizadas.

---

## 2. Linha do Tempo e Principais Entregas por Frente

```
[17/11 - Manhã] Header Adaptado ao Auth (aba12c8)
       │
       ├─► UI/Formulários: Rolagem no Login e campos de Perfil (0f6275d, 7dad491, 80340b4)
       ├─► Checkout & Contrato: Checkout modular e formalização D-21 sem estoque falso (08da971, 041eec5)
       ├─► Chat & Placeholder: ChatWidget no Layout e ProductImage dinâmico (e722a5a, f3a2f20)
       ├─► Design System: Identidade Visual Jost, temas Claro/Escuro, Logo SVG (2515519, 48b899f)
       ├─► Layout & Home: Header com query string, Home com #novidades, rotas legais (6be40ea, c8921a4)
       └─► Back-end (Tarefa B1): Docker Postgres, seed de 200 produtos e API REST (c12af20)
```

### 2.1. Design System e Identidade Visual (Decisão D-24)
- **Tipografia:** Substituição da fonte Inter pela família tipográfica **Jost** (Google Fonts, pesos 400, 500, 600 e 700), configurada no `index.html` e nos tokens globais (`--font-sans`).
- **Paleta de Cores e Temas Claro/Escuro:**
  - Tema Claro: base creme `#FAF7F2`, marrom institucional `#6B4E3D`, terracota brand `#C9795D`.
  - Tema Escuro: base `#1A1412`, superfícies `#261E1B` e `#302622`, terracota iluminado `#E08E70`.
  - Tokens semânticos estendidos: `--color-brand`, `--color-brand-contrast`, `--color-accent`, `--color-accent-ink`, `--color-field-border` e `--color-logo`.
  - Conformidade estrita WCAG AA (critério 1.4.11): inclusão de `--color-field-border` (claro `#9C8D79`, escuro `#7D6B5D`) garantindo contraste >= 3:1 em bordas de inputs, botões outline e chips.
- **Componente `<ThemeToggle />`:** Botão acessível com `aria-label="Alternar tema claro e escuro"` e `aria-pressed`, sincronizado ao `localStorage` (`horizonte-theme`) e ao `prefers-color-scheme`.
- **Prevenção de FOUC (*Flash of Unstyled Content*):** Script síncrono inline posicionado no `<head>` do `index.html`, aplicando o atributo `data-theme` antes da primeira renderização do CSS.
- **Identidade Vetorial (`<Logo />`):** Componente oficial em `src/components/ui/Logo/` e arquivo SVG vetorial geométrico com semicírculos e wordmark com kerning refinado (`letter-spacing: 0.18em`).

### 2.2. Telas, Layout e Experiência do Usuário (UI)
- **Header e Navegação Ativa:**
  - Nav central atualizada para "Início" (`/`), "Novidades" (scroll suave até `#novidades`), "Masculino" (`/catalogo?categoria=Masculino`) e "Feminino" (`/catalogo?categoria=Feminino`).
  - Destaque ativo apurado através de `useLocation` e `URLSearchParams`: categorias só ficam ativas quando a query string coincidir exatamente.
  - Integração do `<Logo />` (40px) e do `<ThemeToggle />`.
- **Footer Institucional:**
  - Redesenhado com `<Logo />` (36px), alinhamento limpo em `.container` e links públicos para as 4 novas páginas institucionais e legais. Sem formulários falsos de newsletter.
- **Páginas Institucionais e Legais (Decisão D-26):**
  - Implementação das rotas `/institucional`, `/privacidade`, `/termos` e `/cookies`.
  - Todas contam com aviso institucional acadêmico no topo e transparência estrita sobre Firebase Auth, armazenamento local de tema e tráfego do cabeçalho `X-Sessao-Id`.
- **Home Page Renovada:**
  - Hero com arte geométrica contida (sem estouro de container), semicírculo terracota e subtítulo acolhedor.
  - Categorias conectadas ao hook real `useCategorias`, exibindo as 9 categorias reais da loja com mapeamento visual de ícones Lucide (sem mocks).
  - Seção `#novidades` (Decisão D-25) com `scroll-margin-top` compensando a barra de navegação e exibindo os 8 últimos SKUs do catálogo com selo `Novo`.
  - Banner editorial com novo alinhamento e Faixa de Pilares transparentes (ambiente demonstrativo acadêmico, sem prazos de entrega fictícios).
- **Aprimoramentos em Login, Perfil e Checkout:**
  - Login: centralização vertical via `margin-block: auto` eliminando cortes de cabeçalho em telas de 1366x720 px (`100dvh`).
  - Perfil: campo de e-mail desativado/leitura com placeholder do e-mail autenticado; campos de nome e telefone persistentes; gerenciamento completo de múltiplos endereços.
  - Checkout: separação modular em subcomponentes com menos de 200 linhas (`CheckoutEndereco`, `CheckoutPagamento`) e tela de sucesso (`CheckoutSuccess`) sem IDs falsos de pedido.
  - ChatWidget: assistente virtual flutuante (60px) com contraste acessível, tokens de marca `--color-brand` e retenção de foco (Esc / Tab trap).

### 2.3. Back-end e Banco de Dados PostgreSQL (Tarefa B1)
- **Container PostgreSQL 16 Alpine via Docker Compose:**
  - Serviço `horizonte_postgres` configurado com volume persistente `postgres_data`, timezone UTC e healthcheck automático via `pg_isready`.
  - Isolamento de portas parametrizável via `.env` (`POSTGRES_PORT`), prevenindo conflitos com instâncias locais do host.
- **Esquema Relacional `loja` (`backend/db/init.sql`):**
  - Baseado no `init_analytics.sql`, mantendo total retrocompatibilidade e acrescentando:
    - `loja.produtos`: coluna `ordem INT GENERATED ALWAYS AS IDENTITY` para preservação e consulta da ordem real de inserção;
    - `loja.usuarios`: `usuario_id TEXT PRIMARY KEY` (compatível com UID do Firebase), nome, email, telefone;
    - `loja.enderecos`: `id BIGSERIAL PRIMARY KEY`, FK para usuários, CEP, logradouro, número, bairro, cidade, UF e flag `padrao`;
    - `loja.favoritos`: FK composta (`usuario_id`, `sku`) com indexação rápida;
    - Triggers automáticos para atualização de `updated_at`.
- **Carga de Dados Real e Idempotente (`seed-catalogo.js`):**
  - Leitura direta de `data/catalogo.csv` (200 SKUs).
  - Execução via `INSERT ... ON CONFLICT (sku) DO UPDATE`, garantindo idempotência estrita (testado e confirmado com 200 registros finais inalterados).
  - Aplicação das regras da **Decisão D-21 (SIMULADO)**:
    - Mapeamento consistente das 10 cores do catálogo para hexadecimais oficiais; Beleza com lista de cores vazia;
    - Atribuição de tamanhos por categoria de vestuário/calçados e "Único" para Casa, Acessórios e Beleza;
    - Descrições curtas e neutras; `imagem_url: null`; exclusão de colunas de estoque fictício.
- **Servidor REST em Node.js + Express (Porta 3000):**
  - Arquitetura limpa sem ORMs, utilizando consultas parametrizadas (`$1, $2, ...`) via pool de conexões do driver nativo `pg`.
  - CORS configurado com `FRONT_ORIGIN` (padrão `http://localhost:5173`).
  - Todos os arquivos com menos de 200 linhas de código.
  - Endpoints validados e funcionais:
    - `GET /api/health` -> `{ ok: true }`
    - `GET /api/categorias` -> Lista ordenada das 9 categorias reais
    - `GET /api/produtos` -> Suporte a filtros (`categoria`, `tamanho`, `busca`, `precoMin`, `precoMax`), paginação (`pagina`, `limite`) e ordenação (`recentes`, `relevancia`, `menor-preco`, `maior-preco`, `melhor-avaliados`)
    - `GET /api/produtos/:id` -> Busca por SKU com retorno 404 padronizado em caso de ausência
    - `GET /api/produtos/:id/semelhantes` -> Até 4 produtos relacionados da mesma categoria
    - `GET /api/produtos/:id/avaliacoes` -> Contrato padronizado com médias e distribuição zeradas

---

## 3. Matriz de Decisões Arquiteturais Consolidadas

| ID | Data | Descrição Sumária | Justificativa Técnica / Negócio |
|---|---|---|---|
| **D-20 (emendada)** | 17/11 | Header com "Início", "Novidades" (âncora `#novidades`), "Masculino" e "Feminino". Ações contextuais de login. | Foco na jornada de compra e simplificação do funil de conversão. |
| **D-21** | 17/11 | Remoção de controle de estoque fictício; catálogo de 200 SKUs como fonte canônica. | Honestidade técnica: o MVP acadêmico não simula regras falsas de inventário. |
| **D-22** | 17/11 | Identificador público do produto nas rotas é o SKU (`id = sku`). | Unificação e rastreabilidade direta entre URL, front-end e catálogo. |
| **D-23** | 17/11 | Eventos de analytics gravados via back-end; front transmite apenas `X-Sessao-Id`. | Desacoplamento da camada visual e garantia de integridade nos dados de BI. |
| **D-24 & Revisão** | 17/11 | Identidade visual Horizonte: tipografia Jost, paleta Creme/Terracota/Marrom, tokens semânticos e anti-FOUC. | Alinhamento à marca, consistência visual e conformidade estrita WCAG AA. |
| **D-25** | 17/11 | Seção `#novidades` na Home destacando os 8 últimos SKUs do catálogo (`ordem DESC`). | Vitrine dinâmica baseada na inserção real do banco. |
| **D-26** | 17/11 | Rotas institucionais e legais (`/institucional`, `/privacidade`, `/termos`, `/cookies`). | Transparência acadêmica, termos de uso e política de privacidade claras. |

---

## 4. Auditoria de Qualidade, Segurança e SonarQube

- **Complexidade e Modularidade:**
  - 100% dos arquivos criados e refatorados no front-end e no back-end possuem menos de 200 linhas de código.
- **Segurança de Dados e Segredos:**
  - `backend/.env` e `.env` devidamente registrados no `.gitignore` e blindados contra commit acidental.
  - Apenas arquivos de exemplo (`.env.example`) mantidos no controle de versão.
  - Consultas SQL 100% parametrizadas no PostgreSQL, prevenindo qualquer vetor de *SQL Injection*.
- **Acessibilidade e Usabilidade (WCAG AA):**
  - Taxas de contraste auditadas: texto pequeno no tema claro utiliza `--color-link` (#6B4E3D) e `--color-muted` (#63554B), atingindo índice > 4.5:1.
  - Elementos de formulário e bordas com `--color-field-border` atingindo índice > 3:1 (critério 1.4.11).
  - Alvos de toque com altura mínima de 44px (`--control-h-sm` / `--control-h-md`).
- **Build e Lint:**
  - `npm run lint`: 0 erros e 0 warnings.
  - `npm run build`: compilação de produção concluída com êxito sem quebras.

---

## 5. Próximos Passos (Transição para a Fase 4)

Com a **Tarefa B1** concluída e o banco populado:
1. **Ligar o Front-end à API (Fase 4):**
   - Implementar os hooks de dados de catálogo (`useProdutos`, `useProdutoDetalhes`, `useSemelhantes`) consumindo `http://localhost:3000/api`.
   - Conectar a vitrine da Home e o Catálogo aos endpoints reais do back-end.
2. **Contextos de Carrinho e Favoritos:**
   - Implementar persistência de favoritos (`loja.favoritos`) e carrinho integrado para usuários autenticados.
3. **Assistente Virtual (`/api/chat`):**
   - Conectar a interface do `ChatWidget` ao endpoint de inteligência artificial.
