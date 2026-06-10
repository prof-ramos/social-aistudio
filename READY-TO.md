# Ready-to: Checklist de Deploy

> Gerado em: 2026-06-09
> Projeto: Social-ASOF
> Branch: `refactor/repositories-and-profile-hooks`
> Stack: React 19 + Supabase + Express 5 + Vite

---

## ✅ Verificações ok

- **TypeScript**: build compila (com ressalvas — strict mode desligado)
- **Testes**: 143/145 passando — base sólida
- **Husky + lint-staged**: configurado e ativo (pré-commit: `vitest related` + `tsc --noEmit`)
- **Documentação**: `CLAUDE.md`, `README.md`, `DESIGN.md`, `AGENTS.md`, `API.md`, `PRODUCT.md`, `PAGES.md`, `GUIA_DESENVOLVEDOR.md` — 9+ arquivos
- **Design system**: maduro — tokens, componentes `ui/`, acessibilidade WCAG AA
- **Database**: 15 migrations SQL, RLS policies, triggers, Supabase Realtime
- **Environment**: `.env.example` completo, `.env.local` configurado
- **Vercel linked**: projeto existe no Vercel (`.vercel/project.json`)
- **Zero TODOs/FIXMEs** no código
- **Vite config**: code-splitting (react/ui/supabase chunks), path alias `@/`

---

## ❌ Bloqueios (resolva antes do deploy)

### B1 — Merge em andamento com conflitos

**Severidade**: 🔴 Alta
**O quê**: A branch `refactor/repositories-and-profile-hooks` está no meio de um merge com `fix/usefeed-and-mentions-cleanup`. Três arquivos com conflitos:

| Arquivo | Situação | Ação |
|---------|----------|------|
| `src/hooks/useFeed.ts` | Conflito resolvido localmente (versão HEAD) | `git add` |
| `src/services/notificationOrchestrator.ts` | Duas implementações diferentes | Escolher versão incoming (`.or(ilike)` — melhor) |
| `src/services/notificationOrchestrator.test.ts` | **Marcadores `<<<<<<<` ativos — não compila** | Substituir pela versão incoming |

**Skill**: manual (editar arquivos + `git add` + `git commit`)

### B2 — notificationOrchestrator.test.ts quebra o type-check

**Severidade**: 🔴 Alta
**O quê**: Arquivo contém `<<<<<<< HEAD` que o esbuild/TypeScript não consegue parsear. 6 erros TS1185.
**Ação**: Substituir pelo conteúdo da versão incoming (`git checkout --theirs`).

### B3 — 2 testes falhando no worktree

**Severidade**: 🟡 Média
**O quê**: `useFeed.test.ts` no worktree (`refactor-work`) tem 2 falhas:
- "filters posts by category correctly" — esperava 2, recebeu 0
- "filters posts by search string correctly" — esperava 1, recebeu 0
**Ação**: Atualizar mocks do `postService` no worktree para incluir `fetchMorePosts` e `subscribeToFeed`.

### B4 — Sem config de deploy

**Severidade**: 🔴 Alta
**O quê**: Nenhum mecanismo de deploy está configurado:
- ❌ Não existe `vercel.json` — Vercel trataria como SPA estático (API Express não funcionaria)
- ❌ Não existe Dockerfile
- ❌ CI só roda Lighthouse — não faz deploy
**Recomendação**: Criar `vercel.json` e decidir estratégia de deploy (ver Opção A abaixo).

---

## ❓ Precisa de decisão

### D1 — Estratégia de deploy

**Contexto**: O app tem um servidor Express customizado (rota `/api/admin/notify-request` com SMTP + rate limiting). No Vercel, sem `vercel.json`, isso não funciona.

**Opção A — Vercel + Serverless Function** (recomendado)
- Criar `vercel.json` configurando rewrites SPA + função serverless
- Refatorar `server.ts` para exportar handler compatível com Vercel
- Prós: integração com Vercel já existe, zero custo de infra
- Contras: precisa adaptar o Express para serverless

**Opção B — Docker + VPS/Render/Railway**
- Criar Dockerfile multi-stage
- Deploy em qualquer plataforma de containers
- Prós: Express funciona como está, sem refatoração
- Contras: custo de infra, gerenciamento de servidor

**Skill**: `/grill-with-docs` para discutir trade-offs

### D2 — Local do `notificationOrchestrator`

**Contexto**: Duas implementações competindo — uma em `src/services/` (`.in()`) e outra (`.or() ilike`). A versão incoming resolve um bug de regex Unicode em menções como `@joão silva and`.
**Recomendação**: Ficar com a versão incoming (`.or(ilike)`) — é superior tecnicamente.
**Skill**: manual (escolher arquivo + `git add`)

### D3 — Worktree `refactor-work` com changes não commitadas

**Contexto**: O worktree tem refatorações importantes em `PostCard.tsx`, `ReactionButtons.tsx`, `AdminAlertCard.tsx`, `index.css` e mocks de teste mais completos. Precisa decidir se commita no worktree ou migra para a branch principal.
**Recomendação**: Commitar no worktree primeiro, depois fazer merge para a branch principal.

### D4 — TypeScript strict mode

**Contexto**: `tsconfig.json` não tem `strict`, `noImplicitAny` ou `strictNullChecks`. 29 `as any` no código (4 em produção).
**Recomendação**: Habilitar `strict` gradualmente — começar com `noImplicitAny`, corrigir os 4 `as any` de produção primeiro.
**Skill**: `/diagnose` para cada correção

### D5 — Documentação desatualizada (Firebase → Supabase)

**Contexto**: `ARCHITECTURE.md`, `API.md` e `GUIA_DESENVOLVEDOR.md` ainda referenciam Firebase. O app migrou para Supabase.
**Recomendação**: Atualizar os 3 arquivos para refletir Supabase + Express 5.
**Skill**: `/edit-article`

---

## 🟡 Atenção (não bloqueante, mas importante)

| Item | Severidade | Ação |
|------|-----------|------|
| Sem `docs/adr/` | Média | Criar ADRs para: Firebase→Supabase, estratégia RLS, refactor postService |
| Sem `CONTEXT.md` | Média | Criar para orientação de agents AI |
| Sem ESLint | Média | Adicionar `typescript-eslint` |
| Test coverage ~27% | Média | Priorizar hooks e serviços não testados |
| 6 deps com major atrasada | Baixa | `lucide-react` 0.546→1.17, `vite` 6→8, `TypeScript` 5→6, etc. |
| `Login.tsx` com credencial hardcoded | Baixa | Remover `handleDevLogin` antes do deploy |
| `Navbar.scrolllock.test.tsx` órfão | Baixa | Remover arquivo |
| `__tests__/PostEditor.test.tsx` duplicado | Baixa | Remover duplicata |
| Sem CI test runner | Baixa | Adicionar `npm test` ao workflow |
| `ARCHITECTURE.md` com Firebase desatualizado | Média | Atualizar para Supabase |
| Sem `src/types/supabase.ts` gerado | Baixa | Rodar `npx supabase gen types` |

---

## Roteiro sugerido

### Fase 1 — Desbloquear merge (urgente)
1. Resolver `notificationOrchestrator.ts` — usar versão incoming
2. Resolver `notificationOrchestrator.test.ts` — usar versão incoming
3. `git add` + `git commit` para finalizar merge
4. Verificar que `npm test` passa (145/145)

### Fase 2 — Garantir deployabilidade
5. Criar `vercel.json` (ou Dockerfile)
6. Adicionar workflow de deploy no GitHub Actions
7. Configurar env vars no Vercel Dashboard

### Fase 3 — Qualidade
8. Habilitar `noImplicitAny` no tsconfig
9. Corrigir 4 `as any` em produção
10. Adicionar ESLint
11. Atualizar docs Firebase→Supabase

### Fase 4 — Dívida leve
12. Remover `Login.tsx` dev credential
13. Remover arquivos de teste órfãos/duplicados
14. Atualizar deps principais (começar por `lucide-react`)
