---
name: criar-componente
description: Cria um componente React (JSX) com CSS Modules e tokens do Horizonte. Use ao criar qualquer componente visual novo, base (components/ui) ou de negócio (components).
---

# Criar componente

## Antes
1. Procure em `src/components/ui/` e `src/components/` se já existe algo igual ou parecido. Se existir, reuse ou estenda; não duplique.
2. Leia a especificação do componente em `docs/DESIGN.md` (seções 4 e 5). Sem especificação? Pergunte ao Caio.
3. Decida a pasta: base visual genérica vai em `components/ui/` (dono: Design); componente que conhece produto, carrinho, pedido etc. vai em `components/` (dono: UI).

## Estrutura
```
components/ui/Button/
  Button.jsx
  Button.module.css
```

## Receita do `.jsx`
- Função com props desestruturadas e valores padrão simples.
- Só renderiza e recebe dados e funções por props. Não chama `fetch`.
- Elementos corretos: `<button>`, `<a>`, `<label>`, `<ul>`. Nunca `div` clicável.
- Ícone sozinho: botão com `aria-label`.
- Ícones vêm de `lucide-react` com tamanho e traço do `docs/DESIGN.md`.
- Exporte como `export default`.

```jsx
import styles from "./Chip.module.css";

export default function Chip({ children, selected = false, onClick }) {
  return (
    <button
      type="button"
      className={`${styles.chip} ${selected ? styles.selected : ""}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

## Receita do `.module.css`
- Mobile-first, só tokens (`var(--…)`), nada de `#hex`.
- Estados: `:hover`, `:focus-visible` (já global), `:disabled`.
- `@media (min-width: 640px)` e `(min-width: 1024px)` só quando precisar.

## Depois
1. Rode `npm run lint`.
2. Confira o componente contra `docs/DESIGN.md` em 390 e 1440 px.
3. Rode `/explicar` sobre o componente.
