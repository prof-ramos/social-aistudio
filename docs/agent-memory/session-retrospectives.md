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