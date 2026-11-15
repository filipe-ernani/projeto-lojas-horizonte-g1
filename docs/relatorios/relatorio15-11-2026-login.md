# Relatório de Implementação e Qualidade — Tela de Login (`/login`)

**Data:** 15/11/2026  
**Projeto:** Lojas Horizonte (`projeto-lojas-horizonte-g1`)  
**Agente:** UI (`ui-builder`)  
**Branch:** `frontend`  
**Fase atual:** Fase 2 — O que não depende de dados  
**Status da Tarefa:** Concluída e testada (100% de aprovação)

---

## 1. Resumo Executivo

Nesta sessão, foi implementada a **Tela de Login (`/login`)** do Horizonte de acordo com as especificações visuais de `docs/DESIGN.md`, consumindo exclusivamente os dados e métodos fornecidos pelo `AuthContext` via `useAuth`.

A tela reúne em uma única rota (`/login`) os três modos fundamentais da experiência de acesso:
1. **Entrar:** Login tradicional por e-mail e senha, autenticação federada com Google e atalho para recuperação de senha.
2. **Criar conta:** Formulário com nome completo (opcional), e-mail, senha e confirmação de senha.
3. **Recuperar senha:** Envio de e-mail com link oficial de redefinição pelo Firebase Auth, informando com clareza ao usuário que o método utilizado é via link (e não por código SMS/e-mail).

---

## 2. Arquitetura e Atendimento ao SonarQube / Clean Code

Seguindo as melhores práticas de Clean Code e as diretrizes do SonarQube para projetos React/JavaScript, o componente foi estruturado de forma modular e desacoplada, garantindo que nenhum arquivo exceda o limite de ~200 linhas previsto em `.agent/rules/01-stack.md`:

| Arquivo | Linhas | Responsabilidade |
|---|---|---|
| `frontend/src/pages/Login/Login.jsx` | 185 | Orquestração de estado, controle de ciclo de vida e renderização do formulário. |
| `frontend/src/pages/Login/LoginBanner.jsx` | 31 | Banner lateral escuro (exibido apenas em desktop >= 1024px) com logo e slogan oficial. |
| `frontend/src/pages/Login/GoogleIcon.jsx` | 37 | Vetor SVG oficial do Google com atributos semânticos de acessibilidade. |
| `frontend/src/pages/Login/loginConstants.js` | 35 | Dicionário de modos (`MODOS`), limites RFC 5321 e mapa declarativo de textos (`CONFIG_MODOS`). |
| `frontend/src/pages/Login/loginValidation.js` | 44 | Função pura de validação de campos sem efeitos colaterais. |
| `frontend/src/pages/Login/Login.module.css` | 385 | Estilos CSS Modules mobile-first com tokens semânticos exclusivos de `tokens.css`. |

### Regras SonarQube endereçadas:
1. **Complexidade Cognitiva e Ciclomática (`javascript:S3776`):**
   - Substituição de cadeias de condicionais no JSX por mapeamento declarativo via `CONFIG_MODOS[modo]`.
   - Separação da lógica de validação em função isolada (`validarCamposAuth`).
2. **Prevenção de Memory Leaks e Atualizações Órfãs (`react:S6440`):**
   - Implementação de `isMountedRef` para evitar chamadas a `setState` após desmontagem do componente pós-redirecionamento.
3. **Eliminação de Strings Mágicas (`javascript:S1192`):**
   - Utilização do objeto congelado `MODOS = Object.freeze(...)`.
4. **Segurança de Entrada (OWASP / RFC 5321):**
   - Limite de 254 caracteres para e-mail e regex imune a ReDoS.
5. **Acessibilidade WAI-ARIA (`jsx-a11y`):**
   - Botões de visibilidade de senha com `aria-controls` e `aria-expanded`.
   - Erros associados aos inputs via `aria-describedby` e `aria-invalid`.
   - Banners de feedback com `role="alert"` (erros) e `role="status"` (sucesso).
   - Foco visível padronizado (`outline: 2px solid var(--color-ink)`).

---

## 3. Evidências dos Testes Automatizados (E2E via CDP)

Foi executada uma suíte de 10 testes de ponta a ponta com o servidor de build em execução (`vite preview`) e navegador Microsoft Edge headless via Chrome DevTools Protocol (CDP):

1. **Redirecionamento de rota protegida:** Acesso a `/carrinho` sem sessão redirecionou automaticamente para `/login`, gravando `state.from`.
2. **Layout responsivo:** Renderização e integridade visual confirmadas em 390 px (mobile), 768 px (tablet) e 1440 px (desktop), sem rolagem horizontal.
3. **Validação de campos vazios:** Exibição imediata das mensagens em português abaixo dos campos.
4. **Visibilidade de senha:** Alternância dinâmica de `type="password"` para `type="text"`.
5. **Autenticação Firebase com credencial inválida:** Retorno do erro real traduzido pelo `AuthContext` ("E-mail ou senha incorretos.").
6. **Alternância para modo Recuperar Senha:** Carregamento correto do formulário e textos informativos.
7. **Disparo de recuperação de senha:** Chamada real aceita pelo Firebase com banner de sucesso.
8. **Alternância para modo Cadastrar Conta:** Exibição dos campos de nome (opcional), senha e confirmação de senha.
9. **Validação de senhas divergentes:** Bloqueio e mensagem "As senhas não coincidem.".
10. **Validação de senha fraca:** Bloqueio para senhas com menos de 6 caracteres.

### Capturas visuais geradas:
- Desktop (1440 px): `login-desktop-1440.png`
- Tablet (768 px): `login-tablet-768.png`
- Mobile (390 px): `login-mobile-390.png`
- Feedback de erro: `login-erro-credenciais.png`
- Feedback de recuperação: `login-recuperar-feedback.png`
- Modo cadastro: `login-cadastrar.png`

---

## 4. Auditoria de Qualidade e Segurança

- **`npm run lint`:** 0 erros e 0 avisos.
- **`npm run build`:** Build de produção gerado com sucesso em 896ms.
- **Segurança:** Arquivo `.env` conferido e protegido pelo `.gitignore`; nenhuma chave ou segredo no código.

---

## 5. Próximos Passos

1. **Commit:** Executar o commit das alterações contendo a tela de login, seus módulos e este relatório.
2. **Fase 2 (UI):** Desenvolver o componente `ChatWidget` (interface flutuante, histórico e chips de sugestão) conforme a seção 5 de `docs/DESIGN.md`.
