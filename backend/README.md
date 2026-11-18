# Back-end Lojas Horizonte

API REST construída com Node.js (ESM), Express e PostgreSQL 16 Alpine via Docker Compose.

---

## 1. Como Subir o Ambiente do Zero

```bash
# 1. Iniciar o container do PostgreSQL
docker compose -f backend/docker-compose.yml up -d

# 2. Executar o seed idempotente do catálogo (200 produtos)
npm --prefix backend run seed

# 3. Iniciar o servidor da API (porta 3000)
npm --prefix backend run dev
```

---

## 2. Como Obter um Token de Teste via REST do Firebase

O back-end valida tokens JWT emitidos pelo Firebase Authentication através do `firebase-admin` (configurado apenas com `FIREBASE_PROJECT_ID=lojas-magazine`).

Para obter um token de teste sem interface gráfica:

1. Obtenha a API Key pública do Firebase definida no front-end (`VITE_FIREBASE_API_KEY` no arquivo `.env` da raiz).
2. Execute a requisição REST para a Identity Toolkit API do Google:

```powershell
# Substitua SUA_API_KEY, seu-email@exemplo.com e sua-senha
$authResponse = curl.exe -s -X POST `
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=SUA_API_KEY" `
  -H "Content-Type: application/json" `
  -d '{"email":"seu-email@exemplo.com","password":"sua-senha","returnSecureToken":true}' | ConvertFrom-Json

# O token JWT fica disponível em:
$token = $authResponse.idToken
```

> **Atenção:** Nunca grave senhas ou tokens em arquivos rastreados pelo Git.

---

## 3. Testando as Rotas Protegidas com o Token

```powershell
# Exemplo: consultar perfil do usuário autenticado
curl.exe -s -H "Authorization: Bearer $token" http://localhost:3000/api/usuarios/perfil
```
