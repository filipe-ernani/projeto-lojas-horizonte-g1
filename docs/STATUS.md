# STATUS.md — Onde paramos

> Atualizado pelo workflow `/handoff` ao fim de cada sessão. Lido pelo `/retomar` no começo da próxima.
> Prazos: congelamento de código **20/11**; apresentação **23/11**.

**Última atualização:** 14/11/2026 (Fase 0 conferida, Button criado e página temporária `/_teste` pronta)
**Fase atual:** 1. Base visual (Design)

## Em andamento

- Fase 1 iniciada: `Button` criado em `frontend/src/components/ui/Button/` + página temporária `/_teste`. Próximo componente: `IconButton`.

## Roteiro por fases

Marque `[x]` quando a tarefa passar na definição de pronto (ver `AGENTS.md`).

### Fase 0. Preparação (14 a 15/11)
- [ ] Criar o projeto Vite (`react`, JSX) e instalar `react-router-dom`, `firebase`, `lucide-react`
- [ ] Copiar este kit para a raiz; importar `tokens.css`, `reset.css`, `global.css` no `main.jsx`
- [ ] Configurar alias `@` para `src/` no `vite.config.js`
- [ ] Carregar a fonte Inter no `index.html`
- [ ] Criar `.env.example` e `.env` (Firebase, `VITE_API_URL`, `VITE_USE_MOCK=true`)
- [ ] Mocks iniciais em `src/mocks/` (produtos, categorias, avaliações) no formato de `docs/API.md`
- [ ] `src/api/client.js` com a chave mock/API

### Fase 1. Base visual (Design)
- [ ] `components/ui/`: Button, IconButton, Field, Checkbox, Radio, Chip, ColorSwatch, Badge, RatingPill, Accordion, QuantityStepper, ProductImage, EmptyState

### Fase 2. Vitrine (UI + Dados)
- [ ] Header e Footer
- [ ] Home
- [ ] Catálogo com filtros (preço, tamanho, categoria), busca e paginação
- [ ] Produto (cor, tamanho, comentários, semelhantes)

### Fase 3. Conta
- [ ] Firebase Auth: login Google e e-mail/senha, recuperar senha, `AuthContext`, `PrivateRoute`
- [ ] Login (tela)

### Fase 4. Compra
- [ ] Favoritos (`FavoritesContext` e tela)
- [ ] Carrinho (`CartContext` e tela)
- [ ] Perfil com endereços
- [ ] Checkout simulado
- [ ] Meus pedidos

### Fase 5. Chat
- [ ] `ChatWidget` com resposta mock
- [ ] Ligar à rota `/api/chat` real

### Fase 6. Acabamento
- [ ] Revisão responsiva em 390, 768 e 1440 px
- [ ] Trocar `VITE_USE_MOCK` para `false` quando a API e o dataset estiverem prontos
- [ ] README do projeto e roteiro da demo (3 minutos)

## Pedidos entre agentes

- **De Design para UI / Dados:** Criar as pastas restantes da estrutura do `AGENTS.md` dentro de `frontend/src/` (`pages/`, `api/`, `hooks/`, `context/`, `mocks/`, `utils/`, `routes/`).
- **De Design para Dados / Infra:** Atualizar `.gitignore` (raiz e `frontend/.gitignore`) com `.env.*`, `!.env.example`, `*-firebase-adminsdk-*.json`, `serviceAccount*.json`, `*.pem`, `*.key` e `.firebase/` (conforme `AGENTS.md` e `D-18`), e criar `.env` a partir de `.env.example`.
- **De Design para UI:** `frontend/src/App.jsx` foi ajustado temporariamente para apontar para a página de teste `/_teste` (`Teste.jsx`); remover a rota temporária quando as telas reais forem criadas.

## Problemas conhecidos

(Vazio.)

## Registro de sessões

| Data | O que foi feito | Commit sugerido | Próximo passo |
|---|---|---|---|
| 14/11 | Kit de agentes, design e contexto criado | `chore: adiciona kit de agentes, design e contexto` | Fase 0 |
| 14/11 | Ajusta `index.html`, registra pendências da Fase 0 e cria componente `Button` + `/_teste` | `feat(ui): cria componente Button e pagina temporaria de teste` | Criar `IconButton` em `components/ui/` |
