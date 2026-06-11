# Plan 008: Tornar sendMessage atômica — inserir mensagem e atualizar sessão em única operação

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d7fdd77..HEAD -- src/services/chatService.ts src/services/chatService.test.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `d7fdd77`, 2026-06-11

## Why this matters

Quando um usuário envia uma mensagem, `chatService.sendMessage` faz duas operações não-atômicas: primeiro insere a mensagem em `chat_messages`, depois atualiza `chat_sessions` com o `last_message` e `updated_at`. Se a segunda operação falha (timeout, erro de rede, etc.), a mensagem fica gravada mas a sessão do chat fica desatualizada — a conversa não sobe na lista e a última mensagem mostrada é errada. Para um público sênior com conexão instável, esse cenário é plausível e causa confusão real.

## Current state

- `src/services/chatService.ts:88-110` — `sendMessage` faz dois writes separados:

```typescript
// src/services/chatService.ts:88-110
sendMessage: async (chatId: string, senderId: string, body: string) => {
    const { error: msgError } = await supabase
      .from('chat_messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        body,
        read: false,
      });

    if (msgError) {
      console.error('Error sending message:', msgError);
      throw msgError;
    }

    const { error: updateError } = await supabase
      .from('chat_sessions')
      .update({
        updated_at: new Date().toISOString(),
        last_message: body,
      })
      .eq('id', chatId);

    if (updateError) {
      console.error('Error updating chat session:', updateError);
      throw updateError;
    }
  },
```

- `src/services/chatService.test.ts` — testes existentes mockam as duas operações separadamente.

Convenções do repo: services encapsulam chamadas ao Supabase SDK; erros são propagados com `throw`; hooks consomem services; testes usam mocks do Supabase.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Install   | `npm install`            | exit 0              |
| Typecheck | `npm run lint`            | exit 0, no errors   |
| Tests     | `npm test`               | all pass (171+)      |

## Scope

**In scope** (the only files you should modify):
- `src/services/chatService.ts` — refatorar `sendMessage` para usar RPC atômica
- `src/services/chatService.test.ts` — atualizar testes

**Out of scope** (do NOT touch):
- `supabase/migrations/` — a RPC já existe como `get_or_create_chat`; adicionar uma nova RPC requer acesso ao banco que não temos no CI. Em vez disso, usar uma approach client-side que garanta consistência (ver Steps).
- `src/hooks/useChatConversation.ts` — não precisa mudar
- `src/pages/Messages.tsx` — não precisa mudar

## Git workflow

- Branch: `advisor/008-atomic-send-message`
- Commit per step; message style: `fix(chat): make sendMessage atomic with transactional RPC`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Criar migration com RPC `send_chat_message`

Criar `supabase/migrations/20260611000100_send_chat_message_rpc.sql`:

```sql
-- Atomic send: insert message + update session in one transaction
CREATE OR REPLACE FUNCTION send_chat_message(
  p_chat_id UUID,
  p_sender_id UUID,
  p_body TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  new_msg_id UUID;
BEGIN
  -- Insert message
  INSERT INTO chat_messages (chat_id, sender_id, body, read)
  VALUES (p_chat_id, p_sender_id, p_body, false)
  RETURNING id INTO new_msg_id;

  -- Update session
  UPDATE chat_sessions
  SET updated_at = NOW(),
      last_message = p_body
  WHERE id = p_chat_id;

  RETURN new_msg_id;
END;
$$;
```

**Verify**: SQL é sintaticamente válido (revisar manualmente se `supabase db push` não estiver disponível)

### Step 2: Refatorar `chatService.sendMessage` para usar a RPC

Em `src/services/chatService.ts`, substituir as duas operações por uma chamada RPC:

```typescript
sendMessage: async (chatId: string, senderId: string, body: string) => {
    const { data, error } = await supabase
      .rpc('send_chat_message', {
        p_chat_id: chatId,
        p_sender_id: senderId,
        p_body: body,
      });

    if (error) {
      console.error('Error sending message:', error);
      throw error;
    }

    return data as string;
  },
```

**Verify**: `npm run lint` → exit 0

### Step 3: Atualizar testes

Em `src/services/chatService.test.ts`, atualizar os testes de `sendMessage` para mockar `supabase.rpc('send_chat_message', ...)` em vez de duas chamadas separadas.

Casos de teste:
1. Mensagem enviada com sucesso — rpc retorna ID, sem erro
2. Erro no rpc — erro é propagado

**Verify**: `npm test` → all pass

### Step 4: Adicionar fallback defensivo (opcional)

Se a RPC `send_chat_message` não existir no banco (ex: migration não aplicada), o `supabase.rpc` vai falhar. Considerar adicionar um fallback client-side que refaz o comportamento de duas operações, mas isso não é obrigatório — a migration deve ser aplicada antes do deploy.

**Verify**: `npm test && npm run lint` → all pass

## Test plan

- Atualizar `src/services/chatService.test.ts`: mockar `supabase.rpc('send_chat_message', ...)` retornando um UUID.
- Casos: (1) sucesso — rpc retorna UUID, função retorna string, (2) erro — rpc lança erro, função propaga.
- Modelo: seguir padrão de mock em `src/services/chatService.test.ts` existente (mock de `supabase.from(...).insert(...).eq(...)`).

## Done criteria

- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0; testes de chatService passam
- [ ] `grep -n "chat_sessions.*update" src/services/chatService.ts` não retorna matches (a atualização de sessão foi movida para a RPC)
- [ ] `grep -n "send_chat_message" src/services/chatService.ts` retorna 1+ matches
- [ ] `plans/README.md` status row atualizado

## STOP conditions

Stop and report back (do not improvise) if:

- O código em `src/services/chatService.ts` não corresponde ao excerpt acima (drift).
- A RPC `send_chat_message` conflita com função existente (verificar migrations).
- Testes existentes falham de forma inesperada e não podem ser corrigidos dentro do escopo.

## Maintenance notes

- Se futuramente o `chat_sessions` receber mais campos atualizáveis no envio (ex: `last_message_sender_id`), a RPC precisa ser atualizada.
- Revisores do PR devem verificar que a RPC usa `SECURITY DEFINER` apenas se necessário; a versão atual roda com os privilégios do chamador, o que é correto já que o RLS já protege as tabelas.
