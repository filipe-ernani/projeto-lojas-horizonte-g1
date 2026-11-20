# Regra: stack e dependências

- Stack fechada: React + Vite (JSX), `react-router-dom`, `firebase`, `lucide-react`, CSS Modules.
- **Não instale pacote novo** sem o Caio aprovar. Se achar que precisa, explique o motivo e a alternativa sem pacote, e pare.
- Não use TypeScript, `.tsx`, Tailwind, styled-components, Zod, TanStack Query, axios nem Redux.
- Dados: `fetch` nativo dentro de `src/api/`. Estado: `useState`, `useEffect`, Context API e hooks próprios.
- Antes de usar uma API de biblioteca (React Router, Firebase), confirme na documentação oficial se houver ferramenta de documentação disponível (ex.: Context7). Não escreva de memória uma função que você não tem certeza que existe.
- Importe com o alias `@/` (aponta para `src/`). Exemplo: `import Button from "@/components/ui/Button/Button";`.
- Função e componente com nome claro; um componente por arquivo; sem arquivo com mais de ~200 linhas sem motivo.
