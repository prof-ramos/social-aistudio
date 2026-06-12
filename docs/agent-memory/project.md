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

## Plans 001-012 — todos DONE

- Todos os 12 plans (001-012) estão DONE. Nenhum plan pendente.
- Plan 012 completou a finalização de CPF encryption (DROP COLUMN, get_crypt_key() SECURITY DEFINER, schema qualification).
- `plans/README.md` atualizado com status DONE para todos.

## Migrations 20260612 aplicadas ao banco remoto

- `20260612000000` — DROP COLUMN cpf (com safety check que impede DROP se CPFs não criptografados existem)
- `20260612000100` — vault approach (obsoleta, substituída por 00200)
- `20260612000200` — `get_crypt_key()` SECURITY DEFINER com chave embutida (abordagem final)
- `20260612000300` — fix column ambiguity em `get_member_requests_for_admin`
- `20260612000400` a `20260612000600` — schema-qualify all refs (iterações: tabelas, funções, tipos enum)

## Bugs resolvidos (GitHub issues)

- **#5** Feed flicker: remoção de subscription de reactions do Realtime; UI otimista
- **#6** notifyMentions: regex Unicode (`[\p{L}\p{M}\p{N}'-]+`) + query `.in()` por nomes, sem `getAllUsers()`
- **#7** Paginação: offset-based `.range()` em vez de cursor `(created_at, id)`
- **#8** notify-request: validação de campos, verificação de existência/status (404/409)
- **#9** TanStack Query: aberta — mudança arquitetural, requer planejamento dedicado

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

## AuthProvider timeout reduzido para 5s + test coverage

- `AUTH_TIMEOUT_MS` em `src/contexts/AuthContext.tsx` reduzido de `8000` para `5000` (commit `3fbbbf6`).
- Novo arquivo `src/contexts/AuthContext.test.tsx` com 2 tests: timeout + early resolution.
- **Contagem de tests atualizada**: 34 arquivos, 173 tests passando (era 33 arquivos / 171 tests).

## Issues abertas pós-sessão (2026-06-12)

- **#9** — TanStack Query para cache e reduzir re-fetch redundante (já existia, bem detalhada)
- **#20** — B2: Dockerfile multi-stage para deploy reprodutível
- **#22** — B3: Code-splitting para reduzir chunk inicial de 553KB
- **#23** — Sprint 0: Configurar base shadcn/ui

## Projeto Supabase linkado

- Project ref: `xgghwjumuuxlppjspbhj` (asof-space)
- Region: South America (São Paulo)
- Pooler URL disponível em `supabase/.temp/pooler-url`