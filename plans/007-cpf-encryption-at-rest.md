# Plan 007: Criptografar CPF em repouso nas tabelas member_requests e users

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d7fdd77..HEAD -- supabase/migrations/ src/services/memberRequestService.ts src/services/adminService.ts src/services/userService.ts src/pages/RegisterRequest.tsx src/types/index.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `d7fdd77`, 2026-06-11

## Why this matters

CPF é o equivalente brasileiro do SSN — dado pessoíssimo cuja exposição viola a LGPD e gera risco de fraude. Atualmente o CPF é armazenado como texto plano em `member_requests.cpf` e `users.cpf`. Qualquer vazamento do banco (backup exposto, SQL injection futura, insider) expõe CPFs de todos os associados. A correção criptografa o CPF no lado do banco com `pgcrypto`, de forma transparente para a aplicação: o valor chega cifrado, só é decifrado quando a RLS permite e a query pede explicitamente.

## Current state

- `supabase/migrations/20260608013515_schema_init.sql:56` — `cpf TEXT` na tabela `member_requests` (texto plano).
- `supabase/migrations/20260609000300_add_profile_contact.sql` — não adiciona `cpf` à `users`, mas `adminService.createUserFromRequest` insere `cpf` na tabela `users`.
- `src/services/memberRequestService.ts:4` — `createRequest` envia `data.cpf` diretamente no insert.
- `src/services/adminService.ts:90-101` — `createUserFromRequest` insere `requestData.cpf` na tabela `users` (colunas `cpf` e `matricula` inexistentes no schema — bug preexistente).
- `src/types/index.ts:72-83` — `MemberRequest` tem `cpf?: string`.
- `src/pages/RegisterRequest.tsx:11` — formulário coleta CPF via `formData.cpf`.
- RLS em `member_requests`: "Anyone create requests" permite INSERT sem autenticação — o CPF fica acessível no banco mesmo para clientes não autenticados.

Exemplos de código atual:

```typescript
// src/services/memberRequestService.ts:7-17
export const memberRequestService = {
  createRequest: async (data: any) => {
    const { data: inserted, error } = await supabase
      .from('member_requests')
      .insert({
        name: data.name,
        email: data.email,
        cpf: data.cpf,          // <-- texto plano
        matricula: data.matricula,
        // ...
      })
      .select()
      .single();
    // ...
  }
};
```

```sql
-- supabase/migrations/20260608013515_schema_init.sql
CREATE TABLE member_requests (
  -- ...
  cpf TEXT,                     -- <-- sem criptografia
  matricula TEXT,
  -- ...
);
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npm run lint`            | exit 0, no errors   |
| Tests     | `npm test`               | all pass (171+)      |

## Scope

**In scope** (the only files you should modify):
- `supabase/migrations/` — nova migration para habilitar pgcrypto e criptografar colunas cpf
- `src/services/memberRequestService.ts` — ajustar insert para enviar CPF criptografado
- `src/services/adminService.ts` — ajustar `createUserFromRequest` para enviar CPF criptografado
- `src/types/index.ts` — atualizar tipo `MemberRequest` se necessário
- `src/pages/AdminMembers.tsx` — garantir que CPF exibido seja decriptografado
- `src/services/memberRequestService.test.ts` — atualizar testes se necessário
- `src/services/adminService.test.ts` — atualizar testes se necessário
- `supabase/migrations/` (mesmo arquivo do Step 1) — adicionar colunas `cpf_encrypted BYTEA` e `matricula TEXT` à tabela `users` (Step 3b)

**Out of scope** (do NOT touch):
- `src/pages/RegisterRequest.tsx` — o formulário continua coletando CPF como texto; a criptografia é responsabilidade do service/migration
- RLS policies — não modificar; a criptografia é defense-in-depth, não substitui RLS

## Git workflow

- Branch: `advisor/007-cpf-encryption`
- Commit per step; message style: `feat(security): encrypt CPF at rest with pgcrypto`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Criar migration para habilitar pgcrypto e adicionar coluna cifrada

Criar nova migration: `supabase/migrations/20260611000000_encrypt_cpf.sql`.

Conteúdo:
```sql
-- Habilitar extensão pgcrypto (já disponível no Supabase)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Adicionar coluna cpf_encrypted na tabela member_requests
ALTER TABLE member_requests ADD COLUMN IF NOT EXISTS cpf_encrypted BYTEA;

-- 2. Migrar dados existentes: criptografar CPFs atuais com chave derivada
-- IMPORTANTE: A chave virá de uma variável de ambiente no Supabase (app setting).
-- Usamos pgp_sym_encrypt/pgp_sym_decrypt com a chave ASOF_CRYPT_KEY.
-- Execute apenas se houver dados existentes:
UPDATE member_requests
SET cpf_encrypted = pgp_sym_encrypt(cpf, current_setting('app.asof_crypt_key', true))
WHERE cpf IS NOT NULL AND cpf_encrypted IS NULL;

-- 3. Remover coluna cpf em texto plano (após verificação)
-- DESCOMENTE APÓS VERIFICAR QUE cpf_encrypted ESTÁ POPULADA:
-- ALTER TABLE member_requests DROP COLUMN cpf;
-- ALTER TABLE member_requests RENAME COLUMN cpf_encrypted TO cpf;

-- 4. Repetir para tabela users se a coluna cpf existir
-- Verificar com: SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'users' AND column_name = 'cpf';
```

**NOTA**: A variável `app.asof_crypt_key` deve ser configurada como app setting no Supabase Dashboard → Settings → Database → Session settings. Não coloque a chave na migration.

**Verify**: `supabase db push` (ou verificar que o SQL é sintaticamente válido) → exit 0

### Step 2: Atualizar memberRequestService para enviar CPF criptografado

Em `src/services/memberRequestService.ts`, substituir o insert de `cpf: data.cpf` por uma chamada que use `pgp_sym_encrypt` via Supabase RPC ou simplesmente remover o campo `cpf` do insert do lado do cliente e usar uma trigger/database function para criptografar no insert.

**Abordagem recomendada**: Criar uma database function `insert_member_request` que recebe os campos em texto plano e internamente criptografa o CPF antes de inserir.

```sql
-- Na mesma migration
CREATE OR REPLACE FUNCTION insert_member_request(
  p_name TEXT, p_email TEXT, p_cpf TEXT, p_matricula TEXT,
  p_category TEXT, p_current_post TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO member_requests (name, email, cpf_encrypted, matricula, category, current_post, status)
  VALUES (
    p_name, p_email,
    pgp_sym_encrypt(p_cpf, current_setting('app.asof_crypt_key', true)),
    p_matricula, p_category::user_role, p_current_post, 'PENDING'
  )
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;
```

Em `src/services/memberRequestService.ts`:
```typescript
export const memberRequestService = {
  createRequest: async (data: { name: string; email: string; cpf: string; matricula: string; category: string; currentPost: string }) => {
    const { data: inserted, error } = await supabase
      .rpc('insert_member_request', {
        p_name: data.name,
        p_email: data.email,
        p_cpf: data.cpf,
        p_matricula: data.matricula,
        p_category: data.category,
        p_current_post: data.currentPost,
      });

    if (error) {
      console.error('Error creating member request:', error);
      throw error;
    }

    return inserted;
  }
};
```

**Verify**: `npm run lint` → exit 0

### Step 3: Atualizar adminService para acessar CPF decriptografado

Em `src/services/adminService.ts`, a função `createUserFromRequest` lê `requestData.cpf`. Após a mudança, o CPF vem criptografado do banco. Criar uma database function `decrypt_cpf` ou ajustar a query de leitura para usar `pgp_sym_decrypt`.

```sql
-- Na mesma migration
CREATE OR REPLACE FUNCTION get_member_requests_for_admin()
RETURNS TABLE(
  id UUID, name TEXT, email TEXT, cpf_decrypted TEXT,
  matricula TEXT, category user_role, current_post TEXT,
  status request_status, rejection_reason TEXT, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.id,
    mr.name,
    mr.email,
    pgp_sym_decrypt(mr.cpf_encrypted, current_setting('app.asof_crypt_key', true)) AS cpf_decrypted,
    mr.matricula,
    mr.category,
    mr.current_post,
    mr.status,
    mr.rejection_reason,
    mr.created_at
  FROM member_requests mr
  WHERE EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN');
END;
$$;
```

Atualizar `adminService.subscribeToAllRequests` para usar esta RPC em vez de SELECT direto.

**Verify**: `npm run lint` → exit 0

### Step 3b: Adicionar colunas `cpf_encrypted` e `matricula` à tabela `users` + criar `create_user_from_member_request()` RPC

**⚠️ Schema gap**: A tabela `users` (`20260608013515_schema_init.sql:11-23`) NÃO possui colunas `cpf` ou `matricula`. O código atual em `adminService.createUserFromRequest` (`adminService.ts:96`) faz insert de `cpf` e `matricula` em colunas inexistentes — bug mascarado por testes com mocks. Sem este step, a function `create_user_from_member_request()` falharia em runtime com erro de coluna não encontrada.

Adicionar à mesma migration criada no Step 1 (`20260611000000_encrypt_cpf.sql`):

```sql
-- 1. Adicionar colunas à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf_encrypted BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS matricula TEXT;

-- 2. Criar SECURITY DEFINER function para escrita criptografada
CREATE OR REPLACE FUNCTION create_user_from_member_request(
  p_uid UUID,
  p_name TEXT,
  p_email TEXT,
  p_role TEXT,
  p_cpf TEXT,
  p_matricula TEXT,
  p_current_post TEXT
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (id, name, email, role, cpf_encrypted, matricula, current_post)
  VALUES (
    p_uid, p_name, p_email, p_role::user_role,
    pgp_sym_encrypt(p_cpf, current_setting('app.asof_crypt_key', true)),
    p_matricula, p_current_post
  );
END;
$$;
```

Atualizar `adminService.createUserFromRequest` para chamar `supabase.rpc('create_user_from_member_request', ...)` em vez do `.from('users').insert(...)` direto.

**Verify**: `npm run lint && npm test` → exit 0, all pass

### Step 4: Atualizar tipos TypeScript

Em `src/types/index.ts`, o tipo `MemberRequest` tem `cpf?: string`. Manter o campo — o valor decriptografado ainda chega como string para o admin.

Atualizar o tipo do parâmetro de `memberRequestService.createRequest` de `data: any` para um tipo tipado (isso também resolve parte do achado 6).

```typescript
export interface MemberRequestInput {
  name: string;
  email: string;
  cpf: string;
  matricula: string;
  category: string;
  currentPost: string;
}
```

**Verify**: `npm run lint` → exit 0

### Step 5: Atualizar testes

Atualizar os testes existentes em `src/services/memberRequestService.test.ts` e `src/services/adminService.test.ts` para refletir a mudança de `insert` direto para `rpc('insert_member_request', ...)`.

**Verify**: `npm test` → all pass

### Step 6: Limpeza — remover coluna cpf em texto plano

Após verificar que `cpf_encrypted` está populada e as queries funcionam, adicionar à migration (ou criar nova migration):

```sql
ALTER TABLE member_requests DROP COLUMN IF EXISTS cpf;
ALTER TABLE member_requests RENAME COLUMN cpf_encrypted TO cpf;
```

**Verify**: `npm test && npm run lint` → all pass

## Test plan

- Atualizar `src/services/memberRequestService.test.ts`: mockar `supabase.rpc('insert_member_request', ...)` em vez de `supabase.from('member_requests').insert(...)`.
- Atualizar `src/services/adminService.test.ts`: se lê CPF, mockar a RPC `get_member_requests_for_admin`.
- Casos de teste: (1) createRequest com CPF válido chama rpc com cpf em texto, (2) admin lê requests com CPF decriptografado, (3) createRequest com CPF vazio/nulo não falha.
- Modelo: seguir `src/services/authService.test.ts` como padrão de mock do Supabase.

## Done criteria

- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0; testes de memberRequestService e adminService passam
- [ ] `grep -rn "cpf_encrypted" src/` retorna matches apenas onde apropriado
- [ ] Migration SQL é sintaticamente válida
- [ ] Nenhuma coluna `cpf TEXT` em texto plano permanece no schema após Step 6
- [ ] `plans/README.md` status row atualizado

## STOP conditions

Stop and report back (do not improvise) if:

- A coluna `cpf` não existe na tabela `member_requests` (schema divergiu).
- A extensão `pgcrypto` não está disponível no Supabase (plano free tier).
- A RLS impede que a RPC `insert_member_request` funcione (testar com role anônimo).
- O `current_setting('app.asof_crypt_key', true)` retorna vazio (variável não configurada).
- Testes existentes falham de forma inesperada após as mudanças.

## Maintenance notes

- A variável `app.asof_crypt_key` deve ser configurada como Database Session Setting no Supabase Dashboard antes de rodar a migration. Se a chave for rotacionada, os dados criptografados com a chave antiga precisam ser re-criptografados.
- Futuras migrações que adicionem colunas sensíveis (ex: dados bancários) devem seguir o mesmo padrão: `pgp_sym_encrypt` via SECURITY DEFINER function.
- Revisores do PR devem verificar: (1) que nenhuma query SELECT expõe `cpf_encrypted` diretamente, (2) que as SECURITY DEFINER functions verificam role ADMIN antes de decriptografar, (3) que a migration não contém a chave de criptografia.
