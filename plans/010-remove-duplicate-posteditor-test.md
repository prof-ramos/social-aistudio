# Plan 010: Remover teste duplicado do PostEditor

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d7fdd77..HEAD -- src/components/feed/PostEditor.test.tsx src/components/feed/__tests__/PostEditor.test.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `d7fdd77`, 2026-06-11

## Why this matters

Existem dois arquivos de teste para o mesmo componente `PostEditor`:
- `src/components/feed/PostEditor.test.tsx` (185 linhas)
- `src/components/feed/__tests__/PostEditor.test.tsx` (64 linhas)

Ambos são descobertos pelo Vitest e executam testes sobre o mesmo componente. Isso causa confusão sobre qual arquivo manter, pode levar a testes conflitantes, e dificulta saber a cobertura real. O arquivo em `__tests__/` é menor e provavelmente é um resquício de uma reorganização de diretório.

## Current state

- `src/components/feed/PostEditor.test.tsx` — 185 linhas, testes mais completos, localizado ao lado do componente (convenção do repo: testes co-localizados).
- `src/components/feed/__tests__/PostEditor.test.tsx` — 64 linhas, subdiretório `__tests__/`, provavelmente um artefato de reorganização.
- Convenção do repo: testes unitários ficam ao lado do arquivo testado (ex: `Button.tsx` + `Button.test.tsx` em `src/components/ui/`).

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npm run lint`            | exit 0, no errors   |
| Tests     | `npm test`               | all pass (171+)      |

## Scope

**In scope** (the only files you should modify):
- `src/components/feed/__tests__/PostEditor.test.tsx` — REMOVER

**Out of scope** (do NOT touch):
- `src/components/feed/PostEditor.test.tsx` — manter (é o teste principal)
- `src/components/feed/PostEditor.tsx` — não modificar
- Qualquer outro arquivo

## Git workflow

- Branch: `advisor/010-remove-duplicate-test`
- Commit: `chore: remove duplicate PostEditor test file`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Verificar que o teste em __tests__ é subconjunto do teste principal

Ler ambos os arquivos e confirmar que os testes em `__tests__/PostEditor.test.tsx` são cobertos por `PostEditor.test.tsx`. Se houver algum teste único no arquivo `__tests__/`, mover para `PostEditor.test.tsx` antes de remover.

**Verify**: inspeção manual dos dois arquivos

### Step 2: Remover o arquivo duplicado

```bash
rm src/components/feed/__tests__/PostEditor.test.tsx
```

Se `__tests__/` ficou vazio após a remoção, remover o diretório também:
```bash
rmdir src/components/feed/__tests__/ 2>/dev/null || true
```

**Verify**: `npm test` → all pass (o número de testes pode diminuir se havia testes duplicados rodando)

### Step 3: Verificar que não há outros diretórios __tests__ com testes órfãos

```bash
find src -type d -name '__tests__'
```

Se houver outros diretórios `__tests__`, verificar se contêm testes duplicados, mas NÃO removê-los neste plano — apenas reportar.

**Verify**: `npm test && npm run lint` → all pass

## Test plan

- Executar `npm test` antes e depois da remoção — o número de testes passando deve ser o mesmo ou menor (se havia testes duplicados contados duas vezes).
- Nenhum teste novo precisa ser escrito — o teste principal já cobre o componente.

## Done criteria

- [ ] `npm run lint` exits 0
- [ ] `npm test` exits 0
- [ ] `test -f src/components/feed/__tests__/PostEditor.test.tsx` returns non-zero (file removed)
- [ ] `plans/README.md` status row atualizado

## STOP conditions

Stop and report back (do not improvise) if:

- O teste em `__tests__/` contém casos de teste únicos não presentes no arquivo principal — NÃO remover; reportar para decidir se devem ser migrados.
- A remoção causa falhas em outros testes (improvável, mas possível se houver imports cruzados).

## Maintenance notes

- A convenção de co-localização de testes (arquivo.test.tsx ao lado de arquivo.tsx) deve ser seguida para novos testes.
- Se no futuro o time decidir adotar `__tests__/` como padrão, migrar todos os testes de uma vez, não misturar convenções.
