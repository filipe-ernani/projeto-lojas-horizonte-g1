# Kit de agentes do front-end Horizonte

Como colocar isto no projeto (10 minutos).

## 1. Criar o projeto

```bash
npm create vite@latest horizonte-front -- --template react
cd horizonte-front
npm install
npm install react-router-dom firebase lucide-react
```

## 2. Copiar o kit

Copie **o conteúdo** desta pasta para a raiz de `horizonte-front` (mescle com o que o Vite criou):

```
AGENTS.md
.env.example
.agent/            (rules, workflows, skills)
docs/              (PROJECT, DESIGN, API, STATUS, DECISIONS, agentes/)
src/styles/        (tokens.css, reset.css, global.css)
```

O kit traz um `.gitignore` completo (segredos, chaves do Firebase, logs, build). **Mescle** com o `.gitignore` que o Vite criou: mantenha as linhas dos dois, sem apagar nenhuma do kit.

Depois: `cp .env.example .env` e preencha o Firebase. Rode `git status`: o `.env` **não** pode aparecer na lista.

**Commits:** os agentes nunca commitam. Ao fim de cada tarefa o `/handoff` entrega uma sugestão pronta (branch, `git add` de arquivos específicos e mensagem). Você confere o `git status` e roda os comandos.

## 3. Ligar os estilos e a fonte

Em `src/main.jsx`, antes do `App`:

```jsx
import "./styles/tokens.css";
import "./styles/reset.css";
import "./styles/global.css";
```

Apague o `index.css` e o `App.css` que o Vite criou. No `index.html`, dentro do `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

## 4. Alias `@` para `src/`

Em `vite.config.js`:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

## 5. Primeira sessão com os agentes

1. Abra a pasta no Antigravity.
2. Crie uma conversa com o agente **Design** e cole: `Atue como o agente Design. Siga docs/agentes/design-guardian.md e rode /retomar.`
3. Peça: "Crie o componente `Button`." Depois `/revisar`, `/explicar` e `/handoff`.
4. Repita com **Dados** (`utils`, `client.js` e login Firebase) e **UI** (Home).

O guia dos agentes está em `docs/agentes/README.md`.

## 6. Quando o dataset chegar

1. Atualize `docs/API.md` com o formato real.
2. Peça ao agente **Dados** para criar `src/api/` e os hooks de cada recurso (skill `criar-hook-api`).
3. Ligue os hooks às páginas (agente **UI**) e teste sucesso, vazio e erro.
