# Project — Fatos Estáveis do Projeto

## Shadcn/ui com Tailwind v4 (style: radix-nova)

- `@import "shadcn/tailwind.css"` **NÃO é necessário** quando o bloco `@theme inline` está definido no CSS.
- Esse import quebra o build com erro: `[@tailwindcss/vite:generate:build] Can't resolve 'shadcn/tailwind.css'`
- O style `radix-nova` do shadcn/ui usa o `@theme inline` para registrar as variáveis CSS, tornando o virtual import desnecessário.
- **Verificado em**: 2026-06-11, PR #15. Removendo a linha, build passou.

## gh CLI

- `gh pr merge --squash` retorna stdout **vazio** em caso de sucesso.
- Para confirmar, usar: `gh pr view <N> --json state,mergedAt`

## Supabase — migrations aplicadas e estado do banco

- **4 migrations aplicadas em 2026-06-11**:
  - `20260611000000_encrypt_cpf.sql` — pgcrypto extension, `cpf_encrypted BYTEA` columns, SECURITY DEFINER functions (`insert_member_request`, `get_member_requests_for_admin`, `create_user_from_member_request`)
  - `20260611000100_send_chat_message_rpc.sql` — atomic message send RPC
  - `20260611000200_add_postos_column.sql` — `postos TEXT[] DEFAULT '{}'` + GIN index on `users`
  - `20260611000300_common_posto_members_rpc.sql` — `get_common_posto_members` RPC
- **Pendente**: `app.asof_crypt_key` não configurado; backfill de CPFs existentes será manual via Dashboard SQL Editor após configurar a chave.
- **Pendente**: coluna `cpf` em texto plano em `member_requests` será removida em migration follow-up (Plan 007 Step 6).

## Plans 007-011 — status DONE

- Todos os 5 plans (007-011) foram implementados, merged em main e migrations aplicadas.
- Branches locais e remotas `advisor/007` a `advisor/011` foram deletadas.
- `plans/README.md` atualizado com status DONE para 007, 009, 010, 011.

## Supabase Storage — bucket `logos`

- Bucket `logos` criado via migration `20260611200000_logos_storage_bucket.sql` (público, 5MB, `image/svg+xml` apenas).
- Políticas: leitura pública; upload/update/delete restrito a usuários com role `ADMIN`.
- SVGs hospedados:
  - `logos/logo_dark.svg` (branco hardcoded)
  - `logos/logo_optimized.svg` (CSS variables com `prefers-color-scheme: dark`)

## SVG upload no Supabase Storage

- Upload de SVGs exige `contentType: 'image/svg+xml'` explícito no `.upload()`, senão o Supabase salva como `application/octet-stream` e o browser não renderiza.
- Padrão validado: `supabase.storage.from('logos').upload(path, content, { contentType: 'image/svg+xml', upsert: true })`

## Comandos validados — Supabase

- `supabase db push` — aplica migrations pendentes ao banco remoto (usa auth token)
- `supabase db push --dry-run` — preview sem aplicar
- `supabase projects list` — lista projetos (requer login)
- `supabase db query` — conecta APENAS ao banco local (não funciona para remoto)

## Projeto Supabase linkado

- Project ref: `xgghwjumuuxlppjspbhj` (asof-space)
- Region: South America (São Paulo)
- Pooler URL disponível em `supabase/.temp/pooler-url`