# Session Retrospectives

## 2026-06-11 — Merge de branches e finalização

### O que foi feito
- **Merge advisor/008 → main**: commit `40b25f2` — `sendMessage` atômico via RPC transactional + planos de melhoria 007-011
- **Merge PR #15 → main** (squash): commit `08bce4b` — shadcn/ui sprints 0-6, build corrigido (removido `@import "shadcn/tailwind.css"`)
- **Correção extra**: commit `6a7928f` — plano 009 corrigido (removido `CREATE OR REPLACE VIEW users_public` que destruiria colunas de privacidade)
- **Limpeza**: todas as branches locais e remotas deletadas (advisor/008, claude/frontend-shadcn-migration-cnmw9t). Apenas `main` existe.

### Problemas encontrados
1. Prometheus não pode editar código — delegar via `task()`
2. `gh pr merge --squash` não mostra confirmação — verificar com `gh pr view`
3. Planos `improve` podem conter SQL destrutivo — revisar antes de executar

### Pendências
- Nenhuma. Repositório limpo, apenas `main`.

## 2026-06-11 — Retrospectiva: finalização plans 007-011 + migrations Supabase

### O que foi feito
- Limpou 5 branches locais e remotas (advisor/007 a advisor/011)
- Atualizou `plans/README.md` marcando 007, 009, 010, 011 como DONE
- Aplicou 4 migrations Supabase via `supabase db push` (encrypt_cpf, send_chat_message_rpc, add_postos_column, common_posto_members_rpc)
- Corrigiu migration `encrypt_cpf.sql`: schema-qualification de `extensions.pgp_sym_encrypt`/`decrypt` e backfill condicional

### Problemas encontrados
1. `pgp_sym_encrypt()` sem schema qualification falha no Supabase (42883) — corrigido com `extensions.` prefix
2. `current_setting('app.asof_crypt_key', true)` retorna string vazia, não NULL — backfill precisou de bloco condicional DO
3. `supabase db query` e `supabase db execute` não funcionam para banco remoto — apenas banco local
4. DROP COLUMN cpf na mesma migration que adiciona cpf_encrypted — removido; será migration separada

### Pendências
- **`app.asof_crypt_key` não configurada**: as RPCs de criptografia vão falhar até configurar no Dashboard (Settings → Database → Session settings)
- **Backfill de CPFs existentes**: rodar manualmente via Dashboard SQL Editor após configurar a chave
- **DROP COLUMN cpf**: migration follow-up pendente (Plan 007 Step 6)
- **PR #15 (shadcn/ui)**: mencionado no execution plan como Phase 3, mas não executado nesta sessão

### Riscos
- RPCs `insert_member_request` e `create_user_from_member_request` vão falhar em produção até que `app.asof_crypt_key` seja configurada
- Dados existentes de CPF em `member_requests.cpf` (plaintext) permanecem acessíveis até backfill + DROP COLUMN

## 2026-06-11 — Upload de logos ASOF para Supabase Storage

### O que foi feito
- Migration `20260611200000_logos_storage_bucket.sql`: bucket `logos` (público, 5MB, `image/svg+xml`)
- Script `scripts/upload-logos.ts`: upload de SVGs via service role key
- `supabase db push` aplicou migration; script executou com sucesso
- 2 SVGs no ar:
  - `logo_dark.svg` (hardcoded white) → public URL
  - `logo_optimized.svg` (CSS variables, dark mode aware) → public URL

### Problemas encontrados
- Nenhum — fluxo executou sem erros nem rollbacks.

### Pendências
- Nenhuma. Ambos os logos estão acessíveis publicamente e prontos para uso em designs.

### Riscos
- Nenhum novo. Bucket tem políticas restritivas (admin-only write).

## 2026-06-12 — Finalização Plan 012 + bugfix swarm

### O que foi feito
- Completou Plan 012 (CPF encryption cleanup): `get_crypt_key()` SECURITY DEFINER, DROP COLUMN cpf, 3 RPCs funcionais com schema qualification completa
- Resolveu 4 GitHub issues via swarm: #5 (feed flicker), #6 (notifyMentions), #7 (paginação), #8 (validação notify-request)
- 6 commits pushados para origin/main
- Todos os 12 plans (001-012) estão DONE

### Problemas encontrados
1. `ALTER DATABASE SET "app.asof_crypt_key"` falha no Free/Nano mesmo via Dashboard SQL Editor (permission denied)
2. `vault.decrypted_secrets` protegido por RLS — SECURITY DEFINER não consegue ler no Free/Nano
3. `SET search_path = ''` remove TODOS os schemas, incluindo `public` — funções, tabelas e tipos precisam de `public.` prefix
4. Tipos enum (`user_role`, `request_status`) também precisam de schema qualification com search_path vazio
5. Swarm agents trabalharam no main branch ao invés de worktrees isolados

### Decisões tomadas
- Migrou de `current_setting()` para `get_crypt_key()` SECURITY DEFINER (única abordagem viável no Free/Nano)
- Migrou paginação de cursor-based para offset-based (`.range()`)
- Migrou notifyMentions de `getAllUsers()` para query `.in()` por nomes extraídos via regex Unicode
- Removeu subscription de reactions do Realtime (atualização otimista no UI)

### Pendências
- Issue #9 (TanStack Query) — aberta, requer planejamento dedicado
- Migrations 20260612000100 (vault approach) é obsoleta mas já aplicada — sem necessidade de cleanup pois 00200 substituiu as funções

### Riscos
- Rotação de chave de criptografia requer nova migration
- Reações de outros usuários não aparecem em real-time (só na próxima carga) — trade-off aceito para eliminar flicker

## 2026-06-12 — Karpathy Guidelines + docs sync + issues

### O que foi feito
- Aplicou Karpathy Guidelines ao projeto (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution)
- Executou 4 tarefas em paralelo via agents nativos (postService throw, AuthProvider timeout, window.confirm, vitest exclusion)
- Commit `3fbbbf6`: AuthProvider timeout 8s→5s + AuthContext.test.tsx (2 tests)
- Commit `d91e7f9`: sincronização de documentação (PAGES.md, GUIA_DESENVOLVEDOR.md, READY-TO.md, ARCHITECTURE.md, SHADCN-MIGRATION.md)
- Upgrade claude-code 2.1.173 → 2.1.175
- Criou/corrigiu 3 issues: #20 (Dockerfile), #22 (code-splitting), #23 (shadcn Sprint 0)

### Problemas encontrados
1. `omc team` CLI falhou no cmux surface → fallback para `Agent()` nativo
2. `gh issue create --body` com Dockerfile no body → shell executou comandos, body corrompido → usou `--body-file`
3. `replace_all: true` em Edit trocou mais ocorrências do que esperado em SHADCN-MIGRATION.md
4. Subagente (#2 AuthProvider) não conseguiu editar arquivos (restrição de ferramentas) → apliquei manualmente no contexto principal
5. Issue duplicata #21 criada por comando background com body malformado → fechada

### Decisões tomadas
- Usar agents nativos em vez de omc-teams CLI quando o cmux surface falha
- Usar `--body-file` para todos os `gh issue create` com código no body
- Preferir `replace_all: false` com strings específicas em Edits multi-ocorrência
- Commitar docs e código separadamente (docs primeiro, depois código)

### Pendências
- Issue #9 (TanStack Query) — aberta, requer planejamento dedicado
- Issues #20, #22, #23 — criadas mas não implementadas

### Riscos
- Nenhum novo. Sessão foi puramente de manutenção, documentação e planejamento.