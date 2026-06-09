# Critique de Design — Social-ASOF

**Data:** 2026-06-09
**Superfície analisada:** Página de Login + Design System geral
**Framework:** React 19 + Tailwind CSS v4

---

## Pontuação Heurística

| Heurística | Nota | Peso | Weighted |
|---|---|---|---|
| Color & Contrast | 8/10 | 1.2 | 9.6 |
| Typography | 7/10 | 1.0 | 7.0 |
| Layout & Spacing | 8/10 | 1.0 | 8.0 |
| Motion & Animation | 7/10 | 0.8 | 5.6 |
| Interaction & Touch | 6/10 | 1.2 | 7.2 |
| Copy & Voice | 9/10 | 0.8 | 7.2 |
| Bans Compliance | 5/10 | 1.5 | 7.5 |
| AI Slop Resistance | 9/10 | 1.0 | 9.0 |
| **Média Ponderada** | | | **7.64/10** |

---

## Diagnóstico por Heurística

### 1. Color & Contrast — 8/10

**O que funciona:**
- Fundo azul escuro (#0D2A4A → #04528D) com texto branco puro — contraste excelente (~15:1).
- Texto slate (#374151) sobre branco/ice — ~9.2:1, bem acima do WCAG AA.
- Ouro institucional (#c4a35a) usado com parcimônia como acento.

**O que quebra:**
- `text-slate/80` no modo claro: `#374151` a 80% opacidade resulta em ~#556271 sobre branco = ~5.2:1. Passa no limite AA (4.5:1), mas sem margem de segurança. Em telas de baixa qualidade ou com brilho alto, pode falhar.
- `text-sky/80` sobre o gradiente sutil de fundo do `.auth-shell` (ice → sky): contraste potencialmente baixo se o gradiente for visível por baixo de elementos.

**Recomendação:** Subir `text-slate/80` para `text-slate/90` ou usar `#2D3748` direto. Verificar `text-sky/80` em fundo claro.

---

### 2. Typography — 7/10

**O que funciona:**
- Par serif/sans bem escolhido: Cormorant Garamond (display/institucional) + Source Sans 3 (body/funcional). Contraste de categoria claro.
- Escala coerente: `text-xs` (12px) → `text-sm` (14px) → `text-base` (16px) → `text-lg` (18px) → `text-2xl` (24px).
- `text-wrap: balance` não encontrado nos headings — adicionar em `h1`–`h3`.

**O que quebra:**
- **`text-[10px]` é uma praga no projeto.** Encontrado em `PostCard.tsx`, `Profile.tsx`, `LeftSidebar.tsx`, `AdminModeration.tsx`, `Messages.tsx`. O impeccable proíbe texto abaixo de 12px sem justificativa técnica. Em iPhone SE, 10px = ~2.7mm de altura — ilegível para muitos usuários.
- `tracking-[0.32em]` no label "Associação de Oficiais de Chancelaria" (`text-xs`): o tracking excessivo em fonte pequena reduz legibilidade. O impeccable recomenda no máximo `tracking-widest` (0.1em) em tamanhos pequenos.
- `tracking-[0.25em]` em "Social" (`text-2xl`): aceitável para display, mas verificar se não compromete leitura em telas de alta densidade.

**Recomendação:** Banir `text-[10px]` do projeto. Substitua por `text-xs` (12px) em todos os casos. Reduzir tracking do label hero para `tracking-[0.2em]`.

---

### 3. Layout & Spacing — 8/10

**O que funciona:**
- Grid assimétrico `1.05fr / 0.95fr` no desktop cria interesse visual sem ser instável.
- Hero verticalmente centralizado com `justify-center` e agrupamento em `gap-10` — equilíbrio restaurado após correção.
- Card de login com padding fluido (`clamp(1.5rem, 3vw, 2.25rem)`) — adapta-se elegantemente.
- Espaçamento entre botão "Entrar" e links corrigido (`mt-5`, `gap-2`) — respiro adequado sem vazio excessivo.

**O que quebra:**
- O card usa `border: 1px solid` + `box-shadow` com blur de 24px e 64px. Isso é o padrão **ghost-card** que o impeccable proíbe explicitamente: "border: 1px solid X + box-shadow: 0 Npx Mpx ... with M ≥ 16px on the same element". Escolha um: borda definida (1px solid navy ou gold) OU sombra suave (blur ≤ 8px), nunca ambos.
- `border-radius: 0` (`rounded-none`) em inputs e cards é uma escolha de design válida (estilo institucional), mas certifique-se de que seja intencional em toda a superfície. Verificar consistência.

**Recomendação:** Remover o `border` do `.auth-shell__card` e manter apenas a sombra em 2 camadas (blur máximo 8px), ou inverter: manter borda sólida e remover sombra completamente.

---

### 4. Motion & Animation — 7/10

**O que funciona:**
- `.auth-reveal` usa `cubic-bezier(0.22, 1, 0.36, 1)` — ease-out-quart elegante e suave.
- Stagger progressivo: 80ms → 160ms → 280ms. Ritmo natural que guia o olhar do topo para baixo.
- `@media (prefers-reduced-motion: reduce)` implementado corretamente.
- Duração 720ms é um pouco longa, mas aceitável para uma página de entrada.

**O que quebra:**
- `.auth-shell__card:hover` com `transition: box-shadow 0.3s ease` — **box-shadow não é uma propriedade animável no compositor**. Força repaints em cada frame do hover. Substituir por `transform: translateY(-2px)` (que roda em GPU) ou remover o efeito hover do card.
- `filter: blur(8px)` no `.auth-shell__hero-glow` — efeito pesado em GPU. Considerar pré-renderizar ou simplificar.
- `mask-image` com `radial-gradient` no `.auth-shell__hero-grid` — GPU-intensive, especialmente em mobile.

**Recomendação:** Substituir hover do card por `transform: translateY(-2px) scale(1.002)`. Simplificar o glow (blur 4px em vez de 8px) ou usar asset pré-renderizado. Substituir `mask-image` por um gradiente de opacidade no pseudo-elemento.

---

### 5. Interaction & Touch — 6/10

**O que funciona:**
- Botão "Entrar" com `active:scale-[0.98]` + `hover:-translate-y-px` + `hover:shadow-md` — feedback tátil claro.
- Links com `hover:text-asof-blue hover:underline underline-offset-2` — diferenciação clara de estado.
- Botão de revelar senha presente (já implementado) — melhoria de UX significativa.

**O que quebra:**
- **Botão de revelar senha (`Login.tsx:62`) com área de toque ~20x20px** — abaixo do mínimo de 44px (Apple) e 48dp (Material Design). O ícone de 20px está posicionado com `absolute right-3 top-1/2`, sem padding de expansão de hit-area.
- **Button size `sm` (`Button.tsx:37`) com `h-9` (36px)** — abaixo de 44px. Nunca deveria existir em interface mobile.
- **Toggle de senha sem `focus:ring` visível** (`focus:outline-none` sem substituto). Leitores de tela e navegação por teclado ficam perdidos.
- `focus:ring-offset-2` no `Button.tsx` pode ser cortado em containers com `overflow: hidden`.

**Recomendação:**
- Adicionar `min-h-[44px] min-w-[44px] flex items-center justify-center` ao botão de senha.
- Aumentar Button `sm` para `h-10` (40px) como mínimo absoluto, ou garantir `min-h-[44px]` via classe base.
- Adicionar `focus:ring-2 focus:ring-navy` ao botão de toggle.

---

### 6. Copy & Voice — 9/10

**O que funciona:**
- "Acesse a plataforma" — verbo + objeto. Direto.
- "Entrar" — claro, sem ambiguidade.
- "Não tem uma conta? Solicitar acesso" — link com meaning standalone. Não é "Clique aqui".
- "Uso restrito a associados" — afirma exclusividade sem ser arrogante.
- Sem buzzwords: nenhum "empower", "supercharge", "seamless".
- Sem em-dashes (verificado).

**O que quebra:**
- "Apenas associados da ASOF." no `description` do `AuthShell` — é redundante com o "Uso restrito a associados" do hero. Em mobile, onde o hero não aparece, faz sentido. Em desktop, é repetição. Considerar condicional.

---

### 7. Bans Compliance — 5/10

**Violações encontradas:**

1. **Ghost-card pattern (P0):** `.auth-shell__card` combina `border: 1px solid` + `box-shadow` com blur de 24px/64px. **Banido pelo impeccable.**
2. **`text-[10px]` pervasive (P1):** Múltiplos componentes usam 10px — abaixo do mínimo de legibilidade recomendado.
3. **No all-caps body copy (P1):** `Alert.tsx` usa `uppercase tracking-wider` em título de alerta (`h3`). Aceitável para labels curtos (≤3 palavras), mas verificar se não é usado em frases completas.

**O que está OK:**
- Sem gradient text.
- Sem glassmorphism como default (apenas sutil no card).
- Sem hero-metric template.
- Sem numbered section markers (01, 02, 03).
- Sem tiny eyebrow em cada seção (apenas uma no hero, justificada).
- Sem sketchy SVG.
- Sem over-rounded cards (`rounded-none` é intencional).

---

### 8. AI Slop Resistance — 9/10

**Por que passa:**
- Identidade visual clara e específica: institucional/diplomática com navy + gold.
- Tipografia intencional: serif para autoridade, sans para funcionalidade.
- Não é um template SaaS genérico (sem purple gradient, sem hero 3-coluna, sem "trusted by" logos).
- O layout split-screen (brand + form) é comum, mas a execução é refinada.

**Risco residual:**
- O gradiente azul do hero + glow + grid pode ser visto como "AI aesthetic" se não for cuidadosamente calibrado. O padrão grid sutil ajuda a quebrar isso.

---

## Matriz de Achados

| Prioridade | Problema | Arquivo | Recomendação | Confiança |
|---|---|---|---|---|
| **P0** | Ghost-card pattern: border + wide shadow | `src/index.css:137-147` | Remover border OU simplificar shadow para blur ≤ 8px | Alta |
| **P0** | `window.confirm` bloqueia acessibilidade | `src/components/feed/PostEditor.tsx:136` | Substituir por `<ConfirmDialog>` | Alta |
| **P1** | Touch target do toggle senha ~20px | `src/pages/Login.tsx:62-69` | `min-h-[44px] min-w-[44px] flex items-center justify-center` | Alta |
| **P1** | Button `sm` = 36px (abaixo de 44px) | `src/components/ui/Button.tsx:37` | `h-10` ou `min-h-[44px]` na classe base | Alta |
| **P1** | `text-[10px]` ilegível em mobile | Múltiplos arquivos | Substituir por `text-xs` (12px) | Alta |
| **P1** | Box-shadow transition no compositor | `src/index.css:126-131` | Substituir por `transform: translateY(-2px)` | Alta |
| **P1** | `min-h-screen` sobrescreve `min-h-dvh` | `AuthShell.tsx:24-25`, `App.tsx` | Remover `min-h-screen` | Alta |
| **P1** | Toggle senha sem focus ring | `src/pages/Login.tsx:62` | Adicionar `focus:ring-2 focus:ring-navy` | Alta |
| **P2** | Tracking excessivo em label pequeno | `AuthShell.tsx:30` | Reduzir para `tracking-[0.2em]` | Média |
| **P2** | `filter: blur(8px)` pesado em GPU | `src/index.css:104-113` | Reduzir para 4px ou pré-renderizar | Média |
| **P2** | `mask-image` GPU-intensive no hero | `src/index.css:92-102` | Substituir por gradiente de opacidade | Média |
| **P2** | `focus:ring-offset-2` pode ser cortado | `Button.tsx:23` | Verificar containers `overflow: hidden` | Média |
| **P2** | Descrição do Login redundante com hero | `Login.tsx:34` | Condicional: mostrar só em mobile | Baixa |
| **P3** | `text-wrap: balance` ausente em headings | Vários | Adicionar em `h1`–`h3` | Baixa |
| **P3** | Favicon sem `sizes="any"` | `index.html:18` | Adicionar atributo | Alta |

---

## Recomendações de Design

### Imediatas (esta sessão)
1. **Fixar o ghost-card:** Remover o `border` do `.auth-shell__card` e confiar apenas na sombra em 2 camadas (blur 8px máximo). Ou manter borda sólida 1px navy e remover sombra.
2. **Fixar touch target do toggle de senha:** Expandir para 44x44px mínimo.
3. **Adicionar focus ring no toggle de senha.**

### Próxima sprint
4. Banir `text-[10px]` do projeto — substituir por `text-xs`.
5. Corrigir `min-h-screen` vs `min-h-dvh`.
6. Simplificar hero effects (blur 4px, gradiente em vez de mask-image).
7. Substituir `window.confirm` por `<ConfirmDialog>`.

### Backlog
8. Adicionar `text-wrap: balance` aos headings principais.
9. Revisar todos os `focus:ring-offset-2` para garantir visibilidade.
10. Considerar pré-renderizar o glow do hero como SVG ou imagem estática.

---

*Critique gerado pelo skill impeccable — Social-ASOF*
