# Plan 012: Finalizar CPF encryption e cleanup

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MEDIUM (data destruction potential)
- **Depends on**: `app.asof_crypt_key` configured in Supabase Dashboard
- **Category**: security

## Why this matters

As migrations `20260611000000_encrypt_cpf.sql` foram aplicadas, mas:
- A variável `app.asof_crypt_key` ainda não está configurada no Supabase, fazendo as RPCs `insert_member_request`, `get_member_requests_for_admin` e `create_user_from_member_request` falharem em runtime.
- CPFs existentes em `member_requests.cpf` (plaintext) ainda não foram migrados para `cpf_encrypted`.
- A coluna `cpf` em texto plano ainda existe em `member_requests`, mantendo dados sensíveis expostos.

## Current state

- Migration `20260611000000_encrypt_cpf.sql` aplicada com sucesso ao banco remoto.
- Funções SECURITY DEFINER criadas: `insert_member_request`, `get_member_requests_for_admin`, `create_user_from_member_request`.
- Backfill condicional (DO block) foi pulado com NOTICE: `app.asof_crypt_key not configured — skipping plaintext CPF migration`.
- `member_requests.cpf` (TEXT) ainda existe com dados plaintext.
- `member_requests.cpf_encrypted` (BYTEA) existe mas está NULL para todos os registros existentes.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npm run lint`            | exit 0, no errors   |
| Tests     | `npm test`               | all pass (172+)      |
| Migration | `supabase db push`       | exit 0              |

## Scope

**In scope** (the only files you should modify):
- `supabase/migrations/` — nova migration para remover coluna `cpf` de `member_requests`

**Out of scope** (do NOT touch):
- `src/services/memberRequestService.ts` — já usa RPC `insert_member_request`
- `src/services/adminService.ts` — já usa RPCs `get_member_requests_for_admin` e `create_user_from_member_request`
- `src/types/index.ts` — `MemberRequest.cpf` pode permanecer; o campo é preenchido pela RPC de decriptografia

## Steps

### Step 0: Configurar `app.asof_crypt_key` no Supabase Dashboard (MANUAL)

**⚠️ PRÉ-REQUISITO**: Este step não pode ser executado pelo agente. Requer acesso ao Supabase Dashboard.

1. Acessar **Supabase Dashboard → Project Settings → Database → Session settings**
2. Adicionar: `app.asof_crypt_key` = `<chave-secreta-gerada>`
3. A chave deve ser uma string aleatória segura (mínimo 32 caracteres). Gerar com: `openssl rand -base64 32`
4. Salvar e aguardar propagação (~30 segundos)

**Verify**: Rodar no Dashboard SQL Editor:
```sql
SELECT current_setting('app.asof_crypt_key', true);
```
Deve retornar a chave configurada (não string vazia).

### Step 1: Backfill de CPFs existentes (MANUAL)

Após Step 0, rodar no Dashboard SQL Editor:

```sql
-- Verificar quantos registros precisam de backfill
SELECT count(*) FROM member_requests WHERE cpf IS NOT NULL AND cpf_encrypted IS NULL;

-- Backfill: criptografar CPFs existentes
UPDATE member_requests
SET cpf_encrypted = extensions.pgp_sym_encrypt(cpf, current_setting('app.asof_crypt_key', true))
WHERE cpf IS NOT NULL AND cpf_encrypted IS NULL;

-- Verificar que todos foram migrados
SELECT count(*) FROM member_requests WHERE cpf IS NOT NULL AND cpf_encrypted IS NULL;
-- Esperado: 0
```

**Verify**: A query de verificação deve retornar 0 registros sem backfill.

#### Step 1b: Verificação round-trip de decriptografia

Após o backfill, confirmar que a decriptografia funciona end-to-end:

```sql
-- Verificar que a decriptografia retorna o valor original
SELECT count(*) FROM member_requests
WHERE cpf IS NOT NULL
  AND extensions.pgp_sym_decrypt(cpf_encrypted, current_setting('app.asof_crypt_key', true)) != cpf;
-- Esperado: 0 (todas as decriptografias batem com o original)
```

Se o resultado for > 0, a chave pode ter sido transcrita incorretamente no Dashboard. Verificar espaços extras, truncamento, ou encoding.

**Verify**: Round-trip count deve ser 0.

### Step 2: Verificar que as 3 RPCs funcionam com a chave configurada

Rodar no Dashboard SQL Editor (com role service_role ou via interface admin da app):

```sql
-- Testar insert_member_request (deve retornar um UUID)
SELECT insert_member_request(
  'Teste Nome',
  'test@example.com',
  '12345678901',
  'MAT-001',
  'MEMBRO_ATIVO',
  'Posto Teste'
);

-- Testar get_member_requests_for_admin (deve retornar rows com cpf_decrypted)
-- NOTA: requer usuário admin autenticado; usar Dashboard SQL Editor com service_role
-- ou testar via interface admin da app (AdminMembers page)
SELECT * FROM get_member_requests_for_admin();

-- Testar create_user_from_member_request (cria user com CPF criptografado)
-- NOTA: escreve na tabela users; requer auth.uid de admin
SELECT create_user_from_member_request(
  gen_random_uuid(), 'Test User', 'testuser@example.com',
  'MEMBRO_ATIVO', '12345678901', 'MAT-TEST', 'Test Posto'
);

-- Limpar dados de teste
DELETE FROM users WHERE email = 'testuser@example.com';
DELETE FROM member_requests WHERE email = 'test@example.com';
```

Se não for prático testar `create_user_from_member_request` diretamente no SQL Editor (requer auth context), testar o fluxo completo via interface admin da app: criar request → visualizar como admin → aprovar request. O fluxo de aprovação é o caminho que exercita `create_user_from_member_request`.

**Verify**: `insert_member_request` retorna UUID. `get_member_requests_for_admin` retorna rows com `cpf_decrypted` populado.

### Step 3: Criar migration para DROP COLUMN cpf

**⚠️ PRÉ-REQUISITO**: Somente criar esta migration APÓS Steps 0-2 estarem verificados. Se `cpf_encrypted` não estiver populado, NÃO executar este step.

Criar `supabase/migrations/20260612000000_drop_plaintext_cpf.sql`:

```sql
-- Remove plaintext CPF column now that cpf_encrypted is populated and RPCs work.
-- The insert_member_request RPC no longer writes to the cpf column.
-- The get_member_requests_for_admin RPC decrypts cpf_encrypted and returns it as cpf_decrypted.

-- Safety check: abort if any rows still have plaintext CPF without encrypted version
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM member_requests WHERE cpf IS NOT NULL AND cpf_encrypted IS NULL) THEN
    RAISE EXCEPTION 'Cannot drop cpf column: % rows have plaintext CPF without encrypted version',
      (SELECT count(*) FROM member_requests WHERE cpf IS NOT NULL AND cpf_encrypted IS NULL);
  END IF;
END;
$$;

ALTER TABLE member_requests DROP COLUMN IF EXISTS cpf;

-- NOTE: The TypeScript property MemberRequest.cpf is NOT renamed.
-- It is populated from the RPC return field cpf_decrypted (via adminService.ts:54),
-- not from the database column. The RPC get_member_requests_for_admin() decrypts
-- cpf_encrypted and returns it as cpf_decrypted, which is mapped to MemberRequest.cpf.
-- No code reads the plaintext cpf column directly.

**Verify**: `npm run lint` → exit 0

### Step 4: Aplicar migration

```bash
supabase db push
```

**Verify**: Confirmar que a coluna `cpf` foi realmente removida:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'member_requests' AND column_name = 'cpf';
-- Esperado: 0 rows (coluna não existe mais)
```

**Rollback**: Se necessário reverter, re-adicionar a coluna e repopular:
```sql
ALTER TABLE member_requests ADD COLUMN cpf TEXT;
UPDATE member_requests SET cpf = extensions.pgp_sym_decrypt(cpf_encrypted, current_setting('app.asof_crypt_key', true))
WHERE cpf_encrypted IS NOT NULL;
```

### Step 5: Verificar tipos TypeScript (NÃO renomear)

Rodar `npm run lint && npm test` para confirmar que tudo passa. A propriedade `MemberRequest.cpf` **NÃO deve ser renomeada** — ela é populada a partir de `cpf_decrypted` via o mapeamento em `adminService.ts:54` (`row.cpf_decrypted` → `MemberRequest.cpf`), não a partir da coluna de banco. Renomear para `cpf_decrypted` exigiria atualizar 5+ consumidores (AdminMembers.tsx:60, adminService.ts:54,106, adminService.test.ts:74,155-156, RegisterRequest.tsx:77) sem benefício funcional.

**Verify**: `npm run lint && npm test` → all pass

### Step 6: Atualizar `plans/README.md`

Adicionar row para Plan 012 em `plans/README.md` com status DONE após completar todos os steps. Plan 007 já está DONE.

## Test plan

- Verificar no Dashboard SQL Editor que `member_requests` não tem mais coluna `cpf`
- Verificar que `insert_member_request` funciona (insert + read)
- Verificar que `get_member_requests_for_admin` retorna `cpf_decrypted` corretamente
- Verificar que `create_user_from_member_request` funciona (ou fluxo de aprovação admin via app)
- Verificar round-trip: `pgp_sym_decrypt(pgp_sym_encrypt(...))` retorna o valor original
- `npm test` → all pass (172+)

## Done criteria

- [ ] `app.asof_crypt_key` configurado no Supabase Dashboard
- [ ] `member_requests.cpf_encrypted` populado para todos os registros existentes
- [ ] Round-trip de decriptografia verificado (0 divergências)
- [ ] `member_requests.cpf` coluna removida
- [ ] As 3 RPCs (`insert_member_request`, `get_member_requests_for_admin`, `create_user_from_member_request`) funcionam com a chave configurada
- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0
- [ ] `plans/README.md` status row para Plan 012 adicionado

## STOP conditions

Stop and report back (do not improvise) if:

- `app.asof_crypt_key` retorna string vazia após configuração — verificar se o Dashboard salvou corretamente.
- O backfill falha com erro de criptografia — verificar que a chave foi salva como session setting (não como env var).
- Existem registros com `cpf IS NOT NULL AND cpf_encrypted IS NULL` após o backfill — verificar logs de erro.
- Qualquer teste existente falha após as mudanças.
- A coluna `cpf` é referenciada em código client-side que não foi migrado para usar `cpf_decrypted`.

## Maintenance notes

- Se a chave `app.asof_crypt_key` for rotacionada, todos os dados criptografados com a chave antiga precisam ser re-criptografados. Manter backup da chave anterior durante a transição.
- A migration `20260612000000` inclui um safety check que impede o DROP se houver registros sem backfill — nunca remover este check.
- Rows com `cpf IS NULL AND cpf_encrypted IS NULL` são esperadas (requests sem CPF fornecido) e são seguras — o safety check não as sinaliza.
- O RLS policy "Anyone create requests" em `member_requests` permite INSERT direto (bypassando a RPC). Após o DROP da coluna `cpf`, INSERTs diretos que tentem incluir `cpf` falhariam. O client code sempre usa a RPC `insert_member_request`, então isso não é um problema em produção, mas vale considerar tightening o RLS no futuro.
- Realtime subscriptions em `adminService.ts` re-fetcham via RPC em change events, então são seguras após o DROP da coluna `cpf`.