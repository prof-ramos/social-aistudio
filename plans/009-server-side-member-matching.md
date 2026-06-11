# Plan 009: Mover getUsersWithCommonPostos para RPC server-side

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d7fdd77..HEAD -- src/services/userService.ts src/services/userService.test.ts src/components/feed/MemberSuggestionsCard.tsx supabase/migrations/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `d7fdd77`, 2026-06-11

## Why this matters

`getUsersWithCommonPostos` busca até 50 usuários da view `users_public` e filtra em memória no cliente — comparando arrays de postos um a um. Para uma associação com centenas de membros, isso significa transferir dados de todos só para exibir 5 sugestões. O tráfego é desnecessário e a latência cresce linearmente com o número de associados. Uma RPC server-side faz o matching no PostgreSQL (que tem índices e pode escalar) e retorna apenas os membros relevantes.

## Current state

- `src/services/userService.ts:62-72` — `getUsersWithCommonPostos`:

```typescript
// src/services/userService.ts:62-72
getUsersWithCommonPostos: async (excludeUserId: string, userPostos: string[], limitCount: number = 50): Promise<UserProfile[]> => {
    const { data, error } = await supabase.from('users_public').select('*').limit(limitCount);
    if (error || !data) return [];
    const users = data.map(mapUser);
    return users.filter(u => {
      if (u.id === excludeUserId) return false;
      if (u.currentPost && userPostos.includes(u.currentPost)) return true;
      const theirPostos = u.postos || [];
      return theirPostos.some(p => userPostos.includes(p));
    });
  },
```

- `src/components/feed/MemberSuggestionsCard.tsx` — componente que chama `getUsersWithCommonPostos` e exibe sugestões.
- `supabase/migrations/20260608014300_postos_schema.sql` — schema de postos; a tabela `users` tem colunas `current_post` (TEXT) e `postos` (TEXT[] array).

Convenções: services encapsulam Supabase; hooks consomem services; `mapUser` converte snake_case para camelCase; testes mockam `supabase.from(...)`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npm run lint`            | exit 0, no errors   |
| Tests     | `npm test`               | all pass (171+)      |

## Scope

**In scope** (the only files you should modify):
- `supabase/migrations/` — nova migration para adicionar coluna `postos TEXT[]` à tabela `users`, GIN index, atualizar view `users_public`, e criar RPC `get_common_posto_members`
- `src/services/userService.ts` — substituir `getUsersWithCommonPostos` por chamada RPC
- `src/services/userService.test.ts` — atualizar testes
- `src/components/feed/MemberSuggestionsCard.tsx` — verificar se precisa de ajuste na interface de retorno

**Out of scope** (do NOT touch):
- `src/types/index.ts` — UserProfile já tem os campos necessários
- Outros services ou hooks
- A view `users_public` — não modificar

## Git workflow

- Branch: `advisor/009-server-side-member-matching`
- Commit per step; message style: `perf(members): move getUsersWithCommonPostos to server-side RPC`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 0: Verificar e adicionar coluna `postos` à tabela `users`

**⚠️ Schema gap**: A tabela `users` (`20260608013515_schema_init.sql:11-23`) NÃO possui coluna `postos`. O código em `userService.ts:112` e `MemberSuggestionsCard.tsx:70` acessa `user.postos` como se existisse, mas nenhuma migration a criou. A RPC `get_common_posto_members` precisa dessa coluna. Sem ela, a function falha em runtime com `ERROR: column u.postos does not exist`.

Verificar se a coluna existe no banco Supabase (pode ter sido adicionada manualmente):

```sql
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'postos';
```

Se retornar vazio, adicionar na migration:

```sql
-- Adicionar coluna postos à tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS postos TEXT[] DEFAULT '{}';

-- Adicionar GIN index para suportar operador && (array overlap)
CREATE INDEX IF NOT EXISTS idx_users_postos ON users USING GIN (postos);

-- Atualizar users_public view para incluir postos
CREATE OR REPLACE VIEW users_public AS
SELECT id, name, avatar_url, bio, current_post, postos, role, is_online, last_online, interests, created_at
FROM public.users;
```

NOTA: A view `users_public` atual (`20260609000300_add_profile_contact.sql:12-25`) não inclui `postos`. Sem atualizar a view, o client-side `users_public.select('*')` não retorna `postos`, quebrando o código existente que depende de `user.postos`.

**Verify**: `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'postos'` retorna 1 row.

### Step 1: Criar migration com RPC `get_common_posto_members`

Criar `supabase/migrations/20260611000200_common_posto_members_rpc.sql`:

```sql
-- Returns users who share posto(s) with the requesting user.
-- Compares current_post and postos array for overlap.
CREATE OR REPLACE FUNCTION get_common_posto_members(
  p_exclude_user_id UUID,
  p_user_postos TEXT[],
  p_limit INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  avatar_url TEXT,
  role TEXT,
  current_post TEXT,
  postos TEXT[],
  is_online BOOLEAN,
  last_online TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.avatar_url,
    u.role::TEXT,
    u.current_post,
    u.postos,
    u.is_online,
    u.last_online
  FROM public.users u
  WHERE u.id != p_exclude_user_id
    AND (
      u.current_post = ANY(p_user_postos)
      OR u.postos && p_user_postos  -- array overlap operator
    )
    AND u.role != 'PENDENTE'
  ORDER BY
    u.is_online DESC NULLS LAST,
    u.last_online DESC NULLS LAST
  LIMIT p_limit;
END;
$$;
```

Nota: `&&` é o operador de overlap de arrays no PostgreSQL. `SECURITY DEFINER` é necessário porque a função lê da tabela `users` (não da view `users_public`), para ter acesso ao array `postos`. A RPC retorna `postos TEXT[]` porque `MemberSuggestionsCard.tsx:70` usa `user.postos?.filter(...)` para encontrar postos em comum.

**Verify**: SQL é sintaticamente válido

### Step 2: Refatorar `userService.getUsersWithCommonPostos`

Em `src/services/userService.ts`, substituir a implementação client-side:

```typescript
getUsersWithCommonPostos: async (excludeUserId: string, userPostos: string[], limitCount: number = 10): Promise<UserProfile[]> => {
    const { data, error } = await supabase
      .rpc('get_common_posto_members', {
        p_exclude_user_id: excludeUserId,
        p_user_postos: userPostos,
        p_limit: limitCount,
      });

    if (error || !data) {
      console.error('Error fetching common posto members:', error);
      return [];
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      avatarUrl: row.avatar_url,
      role: row.role,
      currentPost: row.current_post,
      postos: row.postos || [],
      isOnline: row.is_online,
      lastOnline: row.last_online,
    } as UserProfile));
  },
```

**Verify**: `npm run lint` → exit 0

### Step 3: Atualizar testes

Em `src/services/userService.test.ts`, atualizar testes de `getUsersWithCommonPostos` para mockar `supabase.rpc('get_common_posto_members', ...)` em vez de `supabase.from('users_public').select(...).limit(...)`.

Casos:
1. RPC retorna membros com postos em comum — mapeados corretamente para UserProfile
2. RPC retorna array vazio — função retorna `[]`
3. RPC retorna erro — função retorna `[]`
4. Limite é passado corretamente como `p_limit`

**Verify**: `npm test` → all pass

### Step 4: Verificar MemberSuggestionsCard

Ler `src/components/feed/MemberSuggestionsCard.tsx` e confirmar que o componente usa apenas os campos retornados pela nova RPC (`id`, `name`, `avatarUrl`, `role`, `currentPost`, `isOnline`, `lastOnline`). Se o componente usa campos extras (ex: `bio`, `interests`), adicionar esses campos ao retorno da RPC.

**Verify**: `npm run lint && npm test` → all pass

## Test plan

- Atualizar `src/services/userService.test.ts`: mockar `supabase.rpc('get_common_posto_members', ...)` retornando array de objetos com campos snake_case.
- Casos: (1) sucesso com resultados, (2) array vazio, (3) erro de RPC, (4) limite customizado.
- Modelo: seguir `src/services/userService.test.ts` existente.

## Done criteria

- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0; testes de userService passam
- [ ] `grep -n "from('users_public').select.*limit" src/services/userService.ts` não retorna matches (fetch client-side removido)
- [ ] `grep -n "get_common_posto_members" src/services/userService.ts` retorna 1+ matches
- [ ] `plans/README.md` status row atualizado

## STOP conditions

Stop and report back (do not improvise) if:

- A coluna `postos` NÃO existe na tabela `users` — verificar com `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'postos'`. Se retornar 0 rows, adicionar a coluna via Step 0 antes de prosseguir.
- A coluna `postos` existe mas é TEXT (não TEXT[]) — o operador `&&` (array overlap) requer TEXT[]; se for TEXT, usar string matching em vez disso.
- O código em `src/services/userService.ts` não corresponde ao excerpt acima (drift).
- `MemberSuggestionsCard` usa campos de `UserProfile` que a RPC não retorna (expandir RPC antes).
- Testes existentes falham de forma inesperada.

## Maintenance notes

- Se campos de `UserProfile` forem adicionados à exibição do `MemberSuggestionsCard`, a RPC pode precisar de novos campos no RETURNS TABLE.
- O operador `&&` (array overlap) depende de GIN index na coluna `postos` para performance. Verificar se existe: `SELECT indexname FROM pg_indexes WHERE tablename = 'users' AND indexdef LIKE '%postos%'`. Se não existir, considerar criar: `CREATE INDEX IF NOT EXISTS idx_users_postos ON users USING GIN (postos);`.
- Revisores do PR devem verificar que a função não vaza dados de usuários com role PENDENTE.
