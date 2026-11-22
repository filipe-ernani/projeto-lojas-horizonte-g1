# Regra: dados e API

- **Sem dados mockados.** Não crie `src/mocks/`, JSON de exemplo, arrays de produtos inventados nem `localStorage` fingindo ser back-end. O dataset e o back-end vêm depois.
- Contrato em `docs/API.md` (**provisório**). Só use rotas e campos que estão lá. Falta algo? Pergunte ao Caio e registre em `docs/DECISIONS.md`.
- Só crie `src/api/<recurso>.js` e o hook do recurso quando o Caio pedir. Até lá, as telas de dados ficam com estrutura e estados e recebem dados **por props**.
- Toda chamada passa por `src/api/`. Telas e componentes **nunca** chamam `fetch` diretamente.
- `src/api/client.js` centraliza: URL base (`VITE_API_URL`), cabeçalho `Authorization` com o ID Token do Firebase e leitura do campo `erro` nas respostas de falha.
- Cada função de `src/api/` devolve o dado já no formato do contrato. Nada de adaptar campos dentro das telas.
- Hooks (`src/hooks/`) devolvem `{ dados, carregando, erro, recarregar }`. Telas tratam os três estados: carregando, erro e vazio. **Sem back-end o estado de erro é o comportamento esperado.**
- Estado global só em Context: `AuthContext` (usuário Firebase), `CartContext` (carrinho), `FavoritesContext` (ids favoritos). Não crie outro sem necessidade.
- O que funciona **sem back-end** e deve ser feito já: login com Firebase (`AuthContext`), rotas privadas, formatadores (`formatCurrency`, `formatDate`).
- Nunca envie `usuarioId`, preço nem total no corpo das requisições: o servidor decide.
- Nunca guarde senha ou token em `localStorage`. O Firebase gerencia a sessão.
- Segredos só em `.env` (fora do Git). Só `.env.example` sem valores.
