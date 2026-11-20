---
name: aplicar-design
description: Confere e corrige o visual de uma tela ou componente do Horizonte contra docs/DESIGN.md (tokens, componentes, responsivo, acessibilidade). Use ao revisar ou ajustar aparência.
---

# Aplicar design

1. Abra `docs/DESIGN.md` e localize o componente ou a tela.
2. No `.module.css`, troque **todo** valor solto por token: cor por `--color-*`, espaçamento por `--space-*`, raio por `--radius-*`, fonte por `--fs-*` e `--fw-*`. Se faltar token, peça ao agente Design (não invente).
3. Estilo:
   - botão principal preto com texto branco; links azuis só para ação textual;
   - sem gradiente, sombra pesada ou emoji;
   - imagem de produto 4:5, fundo `--color-card`, raio `--radius-lg`.
4. Responsivo (mobile-first): confira 390, 768 e 1440 px. Grade 2, 3 e 4 colunas. Sem rolagem horizontal.
5. Acessibilidade: contraste, foco visível, alvos de 44 px, `aria-label` em botão de ícone, `<label>` nos campos.
6. Texto: português do Brasil, "caixa de frase", valores em `R$ 520,00` (via `formatCurrency`).
7. Registre divergências que não consegue resolver em `docs/STATUS.md` > "Problemas conhecidos".
