# Regra: CSS Modules e design

- Um `Nome.module.css` por componente, na mesma pasta do `Nome.jsx`.
- Classes em camelCase. Uso: `import styles from "./Nome.module.css"` e `className={styles.card}`.
- Várias classes: template string (`${styles.btn} ${styles.primary}`). Sem biblioteca de classes.
- **Valores só por token** (`var(--color-ink)`, `var(--space-4)`, `var(--radius-md)`). Proibido: `#hex`, `rgb()`, `px` de espaçamento ou raio fora de `src/styles/tokens.css`.
- Proibido: `!important`, estilo inline (exceto valor dinâmico vindo de props), seletor de tag fora de `src/styles/`.
- **Mobile-first:** escreva o CSS base para 390 px e acrescente `@media (min-width: 640px)` e `@media (min-width: 1024px)`.
- Grade de produtos: use a classe global `.product-grid` (2, 3 e 4 colunas).
- Container de página: classe global `.container`.
- Antes de criar um componente visual novo, veja se já existe em `components/ui/` ou se `docs/DESIGN.md` o descreve. Reuse; não duplique.
- Dono de `src/styles/` e de `components/ui/`: o agente Design. Os outros agentes **usam**, não alteram. Precisa de token ou variante nova? Registre em `docs/STATUS.md` > "Pedidos entre agentes".
