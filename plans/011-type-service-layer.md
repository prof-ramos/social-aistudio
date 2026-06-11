# Plan 011: Eliminar tipos `any` da camada de serviços

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d7fdd77..HEAD -- src/services/memberRequestService.ts src/services/notificationService.ts src/services/postoService.ts src/hooks/usePostDetails.ts src/hooks/useNotifications.ts src/types/index.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `d7fdd77`, 2026-06-11

## Why this matters

O projeto tem strict mode ativo e zero `as any` em código de produção, mas a camada de serviços usa `any` em parâmetros e retornos de função: `memberRequestService.createRequest(data: any)`, `notificationService.createNotification(data: any)`, `postoService` retorna `any[]` em várias funções, e `usePostDetails` usa `useState<any>`. Cada `any` desliga o type checker naquele ponto, permitindo que bugs de forma passem despercebidos. Tipar esses pontos é um refactor de baixo risco que fortalece a rede de segurança do TypeScript.

## Current state

Locais com `any` (excluindo testes):

1. `src/services/memberRequestService.ts:8` — `createRequest: async (data: any)`
2. `src/services/notificationService.ts:9-15` — interface `Notification` definida localmente, `createNotification(data: any)` recebe parâmetro sem tipo
3. `src/services/postoService.ts` — múltiplos `(onUpdate: (postos: any[]) => void)`, `(onUpdate: (reviews: any[]) => void)`, `(onUpdate: (fields: any[]) => void)`, retornos `any`
4. `src/hooks/usePostDetails.ts:8-9` — `useState<any>(null)` para post e `useState<any[]>([])` para comments
5. `src/hooks/useNotifications.ts:3` — `useState<any[]>([])`

Convenções do repo: tipos em `src/types/index.ts`; services retornam tipos de domínio; `mapPostRow` e `mapCommentRow` em `postRepository.ts` são exemplos de mapeamento tipado.

Exemplos de tipagem existente (seguir este padrão):

```typescript
// src/services/postRepository.ts — mapeamento tipado
export const mapPostRow = (row: Record<string, any>): Post => {
  const user = resolveJoinedUser(row.users_public);
  return {
    id: row.id,
    title: row.title,
    // ...
  };
};
```

```typescript
// src/types/index.ts — tipos de domínio
export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole | string;
  body: string;
  createdAt: any;
}
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npm run lint`            | exit 0, no errors   |
| Tests     | `npm test`               | all pass (171+)      |

## Scope

**In scope** (the only files you should modify):
- `src/services/memberRequestService.ts` — tipar parâmetro de `createRequest`
- `src/services/notificationService.ts` — tipar parâmetro de `createNotification`, mover `Notification` para `src/types/index.ts`
- `src/services/postoService.ts` — tipar retornos e callbacks
- `src/hooks/usePostDetails.ts` — tipar state de post e comments
- `src/hooks/useNotifications.ts` — tipar state de notifications
- `src/types/index.ts` — adicionar novos tipos conforme necessário

**Out of scope** (do NOT touch):
- `src/services/postRepository.ts` — já usa `Record<string, any>` no mapeamento (padrão aceitável para rows do Supabase)
- Arquivos de teste — mocks podem continuar usando `any` internamente
- `src/services/searchService.ts` — usa `any` em mapeamentos locais, mas é menos crítico

## Git workflow

- Branch: `advisor/011-type-service-layer`
- Commit per step; message style: `refactor(types): eliminate any from service layer`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Adicionar tipos faltantes em `src/types/index.ts`

> **Conditional check**: Before defining `MemberRequestInput`, check whether it already exists in `types/index.ts` (added by Plan 007). If it does, skip its definition and proceed to the next type. If it does not (Plan 007 not yet landed), define it as shown below.

Adicionar os seguintes tipos (skip any that already exist):

```typescript
// Para memberRequestService
export interface MemberRequestInput {
  name: string;
  email: string;
  cpf: string;
  matricula: string;
  category: string;
  currentPost: string;
}

// Para notificationService (mover da definição local)
export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  actorName: string;
  postId?: string;
  message?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// Para postoService
export interface Posto {
  id: string;
  name: string;
  slug: string;
  country?: string;
  // outros campos conforme retornado pelo Supabase
  [key: string]: unknown;
}

export interface PostoReview {
  id: string;
  postoId: string;
  authorId: string;
  authorName: string | null;
  authorRole: string | null;
  body: string;
  rating: number;
  createdAt: string;
}

export interface PostoField {
  id: string;
  postoId: string;
  fieldType: string;
  body: string;
  authorId: string;
  authorName: string | null;
  authorRole: string | null;
  experienceStart: number;
  experienceEnd: number;
  createdAt: string;
}
```

NOTA: Antes de definir os tipos, verificar os campos reais retornados pelo Supabase lendo o `PostoDetails.tsx` e a migration `20260608014300_postos_schema.sql`.

**Verify**: `npm run lint` → exit 0

### Step 2: Tipar `memberRequestService.createRequest`

Em `src/services/memberRequestService.ts`:

```typescript
import { MemberRequestInput } from '../types';

export const memberRequestService = {
  createRequest: async (data: MemberRequestInput) => {
    // ... mesmo corpo, mas agora data é tipado
  }
};
```

**Verify**: `npm run lint` → exit 0

### Step 3: Tipar `notificationService`

Em `src/services/notificationService.ts`:

1. Mover a interface `Notification` local para `src/types/index.ts` como `AppNotification`.
2. Tipar `createNotification`:

```typescript
import { AppNotification } from '../types';

interface CreateNotificationParams {
  userId: string;
  type: string;
  actorName: string;
  postId?: string;
  message?: string;
  link?: string;
}

export const notificationService = {
  // ...
  createNotification: async (data: CreateNotificationParams): Promise<AppNotification> => {
    // ... mesmo corpo
  },
};
```

3. Atualizar `subscribeToUserNotifications` para usar `AppNotification[]` no callback.

**Verify**: `npm run lint` → exit 0

### Step 4: Tipar `postoService`

Em `src/services/postoService.ts`:

1. Importar `Posto`, `PostoReview`, `PostoField` de `../types`.
2. Substituir `(onUpdate: (postos: any[]) => void)` por `(onUpdate: (postos: Posto[]) => void)`.
3. Substituir `(onUpdate: (reviews: any[]) => void)` por `(onUpdate: (reviews: PostoReview[]) => void)`.
4. Substituir `(onUpdate: (fields: any[]) => void)` por `(onUpdate: (fields: PostoField[]) => void)`.
5. Tipar os mapeamentos dentro de `fetchReviews` e `fetchFields` para retornar os tipos corretos.

**Verify**: `npm run lint` → exit 0

### Step 5: Tipar state em hooks

Em `src/hooks/usePostDetails.ts`:

```typescript
import { Post, PostComment } from '../types';

const [post, setPost] = useState<Post | null>(null);
const [comments, setComments] = useState<PostComment[]>([]);
```

Em `src/hooks/useNotifications.ts`:

```typescript
import { AppNotification } from '../types';

const [notifications, setNotifications] = useState<AppNotification[]>([]);
```

**Verify**: `npm run lint` → exit 0

### Step 6: Atualizar testes se necessário

Se a mudança de tipos quebrou testes, atualizar os mocks para corresponder aos novos tipos. Os testes podem continuar usando dados de teste não-tipados internamente — o importante é que a API pública dos services e hooks esteja tipada.

**Verify**: `npm test` → all pass

## Test plan

- Testes existentes devem continuar passando sem mudanças de comportamento.
- Se algum teste quebrar por causa da tipagem, adicionar tipos aos dados de teste.
- Verificar com `npm run lint` que não há erros de tipo.
- Verificar com `grep -rn "any" src/services/memberRequestService.ts src/services/notificationService.ts src/services/postoService.ts src/hooks/usePostDetails.ts src/hooks/useNotifications.ts` que não restam `any` (excluindo `Record<string, any>` em mapeamentos de row do Supabase).

## Done criteria

- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0
- [ ] `grep -rn ": any" src/services/memberRequestService.ts src/services/notificationService.ts src/services/postoService.ts src/hooks/usePostDetails.ts src/hooks/useNotifications.ts` retorna zero matches (excluindo `Record<string, any>` em mappers)
- [ ] `plans/README.md` status row atualizado

## STOP conditions

Stop and report back (do not improvise) if:

- O código em qualquer arquivo in-scope não corresponde aos excerpts acima (drift).
- A mudança de tipos revela bugs reais no código (ex: campo faltando, tipo incompatível). Neste caso, corrigir o bug E tipar — mas se o bug for complexo, reportar antes.
- O tipo `Posto` precisa de campos que não existem no schema — verificar com a migration e com o uso em `Postos.tsx` e `PostoDetails.tsx`.

## Maintenance notes

- Os novos tipos em `src/types/index.ts` devem ser mantidos sincronizados com o schema do banco. Quando migrations forem adicionadas, verificar se os tipos precisam ser atualizados.
- A geração automática de tipos via `npx supabase gen types typescript` (mencionada no `ARCHITECTURE.md` como roadmap) eventualmente substituirá os tipos manuais — este refactor é compatível com essa migração futura.
- Revisores do PR devem verificar que nenhum `any` foi introduzido como "quick fix" — cada `any` residual precisa de justificativa.
